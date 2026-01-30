// ==========================
// CONFIG
// ==========================
const API_HEADERS = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ==========================
// ENTRY POINT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.getElementById("jobRequestForm").addEventListener("submit", submitJobRequest);
  document.getElementById("storeRequestForm").addEventListener("submit", submitStoreRequest);

  loadDashboard();
});

// ==========================
// DASHBOARD LOADER
// ==========================
async function loadDashboard() {
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
  loadUserApplications();
}

function showAdminDashboard() {
  document.getElementById("adminDashboard").style.display = "block";
  document.getElementById("userDashboard").style.display = "none";

  loadAdminPendingRequests();
  loadAdminAllRequests();
  loadAdminApplications();
}

// ==========================
// LOAD USER REQUESTS
// ==========================
async function loadUserRequests() {
  const res = await fetch("/requests/my", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load user requests");
    return;
  }

  const requests = await res.json();
  const tbody = document.getElementById("userRequests");
  tbody.innerHTML = "";

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No requests found.</td></tr>`;
    return;
  }

  requests.forEach((r) => {
    const tr = document.createElement("tr");

    const typeText = r.type === "job_listing" ? "Job Listing" : "Store";
    const details = r.type === "job_listing" ? `$${r.hourly_rate}/hr` : `$${r.price} (${r.subcategory})`;

    const imageHtml = r.image
      ? `<img src="${r.image}" style="max-width:80px; display:block; margin-top:5px;">`
      : "—";

    // If status is deleted, no delete button and show "Deleted" status
    const statusText = r.status === "deleted" ? "Deleted" : r.status;

    const actionHtml =
      r.status === "deleted"
        ? "—" // No delete button for deleted posts
        : `<button class="delete-request" data-id="${r.id}">Delete</button>`;

    tr.innerHTML = `
      <td>${typeText}</td>
      <td>${r.title}</td>
      <td>${details}</td>
      <td>${statusText}</td>
      <td>${imageHtml}</td>
      <td>${actionHtml}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ==========================
// LOAD USER APPLICATIONS
// ==========================
async function loadUserApplications() {
  const res = await fetch("/applications/user", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load user applications");
    return;
  }

  const applications = await res.json();
  const tbody = document.getElementById("userApplications");
  tbody.innerHTML = "";

  if (applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No applications received yet.</td></tr>`;
    return;
  }

  applications.forEach((app) => {
    const submittedDate = new Date(app.submitted_at).toLocaleString();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${app.job_title}</td>
      <td>${app.applicant_name}</td>
      <td>${app.applicant_email}</td>
      <td>${submittedDate}</td>
      <td><a href="${app.resume_path}" target="_blank" rel="noopener noreferrer">View Resume</a></td>
      <td><button class="delete-application" data-id="${app.id}">Delete</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// ==========================
// LOAD ADMIN PENDING REQUESTS
// ==========================
async function loadAdminPendingRequests() {
  const res = await fetch("/requests/pending", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load admin pending requests");
    return;
  }

  const requests = await res.json();
  const tbody = document.getElementById("adminRequests");
  tbody.innerHTML = "";

  if (requests.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">No pending requests found.</td></tr>`;
    return;
  }

  requests.forEach((r) => {
    const tr = document.createElement("tr");

    const details = r.type === "job_listing" ? `$${r.hourly_rate}/hr` : `$${r.price} (${r.subcategory})`;

    const imageHtml = r.image
      ? `<img src="${r.image}" style="max-width:80px; display:block; margin-top:5px;">`
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
        <button class="delete-request" data-id="${r.id}">Delete</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ==========================
// LOAD ADMIN ALL REQUESTS (ALL POSTS)
// ==========================
async function loadAdminAllRequests() {
  const res = await fetch("/requests/admin/all", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load all posts");
    return;
  }

  const posts = await res.json();
  const tbody = document.getElementById("adminAllPosts");
  tbody.innerHTML = "";

  if (posts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No posts found.</td></tr>`;
    return;
  }

  posts.forEach((p) => {
    const statusText = p.status === "deleted" ? "Deleted" : p.status;
    const actionHtml =
      p.status === "deleted"
        ? "—"
        : `<button class="delete-request" data-id="${p.id}">Delete</button>`;

    tbody.innerHTML += `
      <tr>
        <td>${p.username}</td>
        <td>${p.type}</td>
        <td>${p.title}</td>
        <td>${statusText}</td>
        <td>${actionHtml}</td>
      </tr>
    `;
  });
}


// ==========================
// LOAD ADMIN APPLICATIONS
// ==========================
async function loadAdminApplications() {
  const res = await fetch("/applications/admin", { headers: API_HEADERS() });
  if (!res.ok) {
    console.error("Failed to load admin applications");
    return;
  }

  const applications = await res.json();
  const tbody = document.getElementById("adminApplications");
  tbody.innerHTML = "";

  if (applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No applications found.</td></tr>`;
    return;
  }

  applications.forEach((app) => {
    const submittedDate = new Date(app.submitted_at).toLocaleString();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${app.job_title}</td>
      <td>${app.applicant_name}</td>
      <td>${app.applicant_email}</td>
      <td>${submittedDate}</td>
      <td><a href="${app.resume_path}" target="_blank" rel="noopener noreferrer">View Resume</a></td>
      <td><button class="delete-application" data-id="${app.id}">Delete</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// ==========================
// DELETE HANDLER (GLOBAL)
// ==========================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete-request")) {
    const requestId = e.target.dataset.id;
    if (!confirm("Are you sure you want to delete this request?")) return;

    const isAdmin = document.getElementById("adminDashboard").style.display === "block";
    const url = isAdmin ? `/requests/admin/${requestId}` : `/requests/${requestId}`;

    const res = await fetch(url, {
      method: "DELETE",
      headers: API_HEADERS(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to delete request");
      return;
    }

    if (isAdmin) {
      loadAdminPendingRequests();
      loadAdminAllRequests(); // Refresh both lists after deletion
    } else {
      loadUserRequests();
    }
  }

  if (e.target.classList.contains("delete-application")) {
    const applicationId = e.target.dataset.id;
    if (!confirm("Are you sure you want to delete this application?")) return;

    const res = await fetch(`/applications/${applicationId}`, {
      method: "DELETE",
      headers: API_HEADERS(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to delete application");
      return;
    }

    const row = e.target.closest("tr");
    if (row) row.remove();
  }
});

// ==========================
// ADMIN ACTIONS
// ==========================
async function approveRequest(id) {
  await fetch(`/requests/${id}/approve`, {
    method: "POST",
    headers: API_HEADERS(),
  });
  loadAdminPendingRequests();
  loadAdminAllRequests();
}

async function rejectRequest(id) {
  await fetch(`/requests/${id}/reject`, {
    method: "POST",
    headers: API_HEADERS(),
  });
  loadAdminPendingRequests();
  loadAdminAllRequests();
}

// ==========================
// FORM SUBMISSIONS
// ==========================
async function submitJobRequest(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("type", "job_listing");
  formData.append("title", document.getElementById("jobTitle").value);
  formData.append("description", document.getElementById("jobDescription").value);
  formData.append("hourly_rate", document.getElementById("hourlyRate").value);

  const jobImage = document.getElementById("jobImage");
  if (jobImage?.files[0]) {
    formData.append("image", jobImage.files[0]);
  }

  const res = await fetch("/requests/create", {
    method: "POST",
    headers: API_HEADERS(),
    body: formData,
  });

  if (!res.ok) {
    alert("Failed to submit job request.");
    return;
  }

  e.target.reset();
  loadUserRequests();
}

async function submitStoreRequest(e) {
  e.preventDefault();

  const formData = new FormData();
  formData.append("type", "store");
  formData.append("title", document.getElementById("storeTitle").value);
  formData.append("description", document.getElementById("storeDescription").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("subcategory", document.getElementById("storeSubcategory").value);

  const storeImage = document.getElementById("storeImage");
  if (storeImage?.files[0]) {
    formData.append("image", storeImage.files[0]);
  }

  const res = await fetch("/requests/create", {
    method: "POST",
    headers: API_HEADERS(),
    body: formData,
  });

  if (!res.ok) {
    alert("Failed to submit store request.");
    return;
  }

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
// GLOBALS (INLINE BUTTONS)
// ==========================
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
