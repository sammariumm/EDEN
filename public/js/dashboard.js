// ==========================
// CONFIG
// ==========================
const API_HEADERS = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`
});

// ==========================
// ENTRY POINT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document
    .getElementById("jobRequestForm")
    .addEventListener("submit", submitJobRequest);

  document
    .getElementById("storeRequestForm")
    .addEventListener("submit", submitStoreRequest);

  loadDashboard();
});

// ==========================
// DASHBOARD LOADER
// ==========================
async function loadDashboard() {
  // Note updated fetch URL: /users/me
  const res = await fetch("/users/me", { headers: API_HEADERS() });

  if (!res.ok) {
    logout();
    return;
  }

  const user = await res.json();

  document.getElementById("welcome").textContent = `Welcome, ${user.username}`;

  if (user.isAdmin) {
    showAdminDashboard();
  } else {
    showUserDashboard();
  }
}

// ==========================
// DASHBOARD VISIBILITY
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
// USER REQUEST LIST
// ==========================
async function loadUserRequests() {
  const res = await fetch("/requests/my", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load user requests");
    return;
  }
  const requests = await res.json();

  const list = document.getElementById("userRequests");
  list.innerHTML = "";

  requests.forEach(r => {
    const li = document.createElement("li");

    let text = "";
    if (r.type === "job_listing") {
      text = `${r.title} — $${r.hourly_rate}/hr (${r.status})`;
    } else {
      text = `${r.title} [${r.subcategory}] — $${r.price} (${r.status})`;
    }

    li.innerHTML = `<strong>${text}</strong>`;

    if (r.image_path) {
      const img = document.createElement("img");
      img.src = r.image_path;
      img.style.maxWidth = "150px";
      img.style.display = "block";
      img.style.marginTop = "5px";
      li.appendChild(img);
    }

    list.appendChild(li);
  });
}

// ==========================
// ADMIN REQUEST LIST
// ==========================
async function loadAdminRequests() {
  const res = await fetch("/requests/pending", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load admin requests");
    return;
  }
  const rows = await res.json();

  const tbody = document.getElementById("adminRequests");
  tbody.innerHTML = "";

  rows.forEach(r => {
    const tr = document.createElement("tr");

    let details = r.type === "job_listing"
      ? `$${r.hourly_rate}/hr`
      : `$${r.price} (${r.subcategory})`;

    let imageHtml = r.image_path
      ? `<img src="${r.image_path}" style="max-width:80px; display:block; margin-top:5px;">`
      : "—";

    tr.innerHTML = `
      <td>${r.username}</td>
      <td>${r.type}</td>
      <td>
        <strong>${r.title}</strong><br>
        ${details}<br>
        ${imageHtml}
      </td>
      <td>
        <button onclick="approveRequest(${r.id})">Approve</button>
        <button onclick="rejectRequest(${r.id})">Reject</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ==========================
// ADMIN ACTIONS
// ==========================
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
// FORM SUBMISSIONS
// ==========================
async function submitJobRequest(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("type", "job_listing");
  formData.append("title", jobTitle.value);
  formData.append("description", jobDescription.value);
  formData.append("hourly_rate", hourlyRate.value);

  if (jobImage?.files[0]) {
    formData.append("image", jobImage.files[0]);
  }

  await fetch("/requests/create", {
    method: "POST",
    headers: API_HEADERS(),
    body: formData
  });

  e.target.reset();
  loadUserRequests();
}

async function submitStoreRequest(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("type", "store");
  formData.append("title", storeTitle.value);
  formData.append("description", storeDescription.value);
  formData.append("price", price.value);
  formData.append("subcategory", storeSubcategory.value);

  if (storeImage?.files[0]) {
    formData.append("image", storeImage.files[0]);
  }

  await fetch("/requests/create", {
    method: "POST",
    headers: API_HEADERS(),
    body: formData
  });

  e.target.reset();
  loadUserRequests();
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

// ==========================
// GLOBALS (for inline buttons)
// ==========================
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
