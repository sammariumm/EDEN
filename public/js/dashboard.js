// ==========================
// CONFIG
// ==========================
const API_HEADERS = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${localStorage.getItem("token")}`
});

// ==========================
// LOAD DASHBOARD FUNCTION
// ==========================
async function loadDashboard() {
  try {
    const res = await fetch("/me", {
      headers: API_HEADERS()
    });

    if (!res.ok) {
      logout();
      return;
    }

    const user = await res.json();
    console.log("Logged-in user data:", user); // Debugging

    document.getElementById("welcome").textContent = `Welcome, ${user.username}`;

    if (user.isAdmin) {
      showAdminDashboard();
    } else {
      showUserDashboard();
    }
  } catch (err) {
    console.error("Dashboard load failed:", err);
    logout();
  }
}

// ==========================
// DASHBOARD DISPLAY HELPERS
// ==========================
function showUserDashboard() {
  document.getElementById("userDashboard").style.display = "block";
  document.getElementById("adminDashboard").style.display = "none";
  loadUserRequests();
}

function showAdminDashboard() {
  document.getElementById("adminDashboard").style.display = "block";
  document.getElementById("userDashboard").style.display = "none";
  loadAdminRequests();
}

// ==========================
// USER REQUESTS
// ==========================
async function loadUserRequests() {
  const res = await fetch("/requests/my", {
    headers: API_HEADERS()
  });

  const requests = await res.json();
  const list = document.getElementById("userRequests");

  list.innerHTML = "";

  requests.forEach((r) => {
    const li = document.createElement("li");

    if (r.type === "job_listing") {
      li.textContent = `${r.title} (Job) — ${r.status}, $${r.hourly_rate}/hr`;
    } else if (r.type === "store") {
      li.textContent = `${r.title} (Store - ${r.subcategory || "N/A"}) — ${r.status}, $${r.price}`;
    } else {
      li.textContent = `${r.type} — ${r.status}`;
    }

    list.appendChild(li);
  });
}

async function createRequest(type, details) {
  await fetch("/requests/create", {
    method: "POST",
    headers: API_HEADERS(),
    body: JSON.stringify({ type, ...details }),
  });

  loadUserRequests();
}

// ==========================
// ADMIN REQUESTS
// ==========================
async function loadAdminRequests() {
  const res = await fetch("/requests/pending", {
    headers: API_HEADERS()
  });

  const rows = await res.json();
  const tbody = document.getElementById("adminRequests");

  tbody.innerHTML = "";

  rows.forEach((r) => {
    const tr = document.createElement("tr");

    let details = "";
    if (r.type === "job_listing") {
      details = `${r.title} — $${r.hourly_rate}/hr`;
    } else if (r.type === "store") {
      details = `${r.title} (Category: ${r.subcategory || "N/A"}) — $${r.price}`;
    }

    tr.innerHTML = `
      <td>${r.username}</td>
      <td>${r.type}</td>
      <td>${details}</td>
      <td>
        <button onclick="approveRequest(${r.id})">Approve</button>
        <button onclick="rejectRequest(${r.id})">Reject</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

async function approveRequest(id) {
  await fetch(`/requests/${id}/approve`, {
    method: "POST",
    headers: API_HEADERS()
  });

  loadAdminRequests();
}

async function rejectRequest(id) {
  await fetch(`/requests/${id}/reject`, {
    method: "POST",
    headers: API_HEADERS()
  });

  loadAdminRequests();
}

// ==========================
// EVENT LISTENERS & INIT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();

  document.getElementById("jobRequestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("jobTitle").value.trim();
    const description = document.getElementById("jobDescription").value.trim();
    const hourly_rate = parseFloat(document.getElementById("hourlyRate").value);

    await createRequest("job_listing", { title, description, hourly_rate });
  });

  document.getElementById("storeRequestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("storeTitle").value.trim();
    const description = document.getElementById("storeDescription").value.trim();
    const price = parseFloat(document.getElementById("price").value);
    const subcategory = document.getElementById("storeSubcategory") ? document.getElementById("storeSubcategory").value : null;

    await createRequest("store", { title, description, price, subcategory });
  });
});

// ==========================
// AUTH UTILITIES
// ==========================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

window.logout = logout;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
