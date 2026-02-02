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
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);

  const jobRequestForm = document.getElementById("jobRequestForm");
  if (jobRequestForm) jobRequestForm.addEventListener("submit", submitJobRequest);

  const storeRequestForm = document.getElementById("storeRequestForm");
  if (storeRequestForm) storeRequestForm.addEventListener("submit", submitStoreRequest);

  const jobCancelEditBtn = document.getElementById("jobCancelEditBtn");
  if (jobCancelEditBtn) jobCancelEditBtn.addEventListener("click", cancelJobEdit);

  const storeCancelEditBtn = document.getElementById("storeCancelEditBtn");
  if (storeCancelEditBtn) storeCancelEditBtn.addEventListener("click", cancelStoreEdit);

  loadDashboard();
  loadServiceAvailJobsDropdown();
});

// ==========================
// DASHBOARD LOADER
// ==========================
async function loadDashboard() {
  try {
    const res = await fetch("/users/me", { headers: API_HEADERS() });
    if (!res.ok) {
      logout();
      return;
    }

    const user = await res.json();
    const welcomeElem = document.getElementById("welcome");
    if (welcomeElem) {
      welcomeElem.textContent = `Welcome, ${user.username}`;
    }

    if (user.isAdmin) {
      showAdminDashboard();
    } else {
      showUserDashboard();
    }
  } catch (err) {
    console.error("Error loading dashboard:", err);
    logout();
  }
}

// ==========================
// DASHBOARD VISIBILITY
// ==========================
function showUserDashboard() {
  const userDash = document.getElementById("userDashboard");
  const adminDash = document.getElementById("adminDashboard");

  if (userDash) userDash.style.display = "block";
  if (adminDash) adminDash.style.display = "none";

  loadUserRequests();
  loadUserApplications();
}

function showAdminDashboard() {
  const userDash = document.getElementById("userDashboard");
  const adminDash = document.getElementById("adminDashboard");

  if (adminDash) adminDash.style.display = "block";
  if (userDash) userDash.style.display = "none";

  loadAdminPendingRequests();
  loadAdminAllRequests();
  loadAdminApplications();
}

// ==========================
// LOAD USER REQUESTS
// ==========================
async function loadUserRequests() {
  try {
    const res = await fetch("/requests/my", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load user requests");
      return;
    }

    const requests = await res.json();
    const tbody = document.getElementById("userRequests");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No requests found.</td></tr>`;
      return;
    }

    requests.forEach((r) => {
      let typeText = "";
      let details = "";

      if (r.type === "job_listing") {
        typeText = "Job Listing";
        details = `₱${r.hourly_rate}/hr`;
      } else if (r.type === "store") {
        typeText = "Store";
        details = `₱${r.price} (${r.subcategory})`;
      } else if (r.type === "service_avail") {
        typeText = "Service Avail";
        details = r.parent_job_title
          ? `Linked to job: <strong>${r.parent_job_title}</strong>`
          : "Linked job info not available";
      } else {
        typeText = r.type || "Unknown";
        details = "";
      }

      const imageHtml = r.image
        ? `<img src="${r.image}" style="max-width:80px; display:block; margin-top:5px;">`
        : "—";

      const statusText = r.status === "deleted" ? "Deleted" : r.status;

      // Added Edit button alongside Delete
      const actionHtml =
        r.status === "deleted"
          ? "—"
          : `
            <button class="edit-request" data-id="${r.id}">Edit</button>
            <button class="delete-request" data-id="${r.id}">Delete</button>
          `;

      const tr = document.createElement("tr");
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
  } catch (err) {
    console.error("Error loading user requests:", err);
  }
}

// ==========================
// EVENT LISTENER FOR EDIT & DELETE BUTTONS
// ==========================
document.addEventListener("click", async (e) => {
  // Edit request button
  if (e.target.classList.contains("edit-request")) {
    const requestId = e.target.dataset.id;
    openEditForm(requestId);
    return;
  }

  // Delete request button
  if (e.target.classList.contains("delete-request")) {
    const requestId = e.target.dataset.id;
    if (!confirm("Are you sure you want to delete this request?")) return;

    const isAdmin = document.getElementById("adminDashboard")?.style.display === "block";
    const url = isAdmin ? `/requests/admin/${requestId}` : `/requests/${requestId}`;

    try {
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
        loadAdminAllRequests();
      } else {
        loadUserRequests();
      }
    } catch (err) {
      console.error("Error deleting request:", err);
      alert("Failed to delete request. Please try again.");
    }
    return;
  }

  // Delete application button
  if (e.target.classList.contains("delete-application")) {
    const applicationId = e.target.dataset.id;
    if (!confirm("Are you sure you want to delete this application?")) return;

    try {
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
    } catch (err) {
      console.error("Error deleting application:", err);
      alert("Failed to delete application. Please try again.");
    }
    return;
  }

    // Accept application button
  if (e.target.classList.contains("accept-application")) {
    const applicationId = e.target.dataset.id;
    if (!confirm("Accept this application?")) return;

    try {
      const res = await fetch(`/applications/${applicationId}/accept`, {
        method: "PATCH",
        headers: API_HEADERS(),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to accept application");
        return;
      }

      loadAdminApplications();
    } catch (err) {
      console.error("Error accepting application:", err);
      alert("Failed to accept application.");
    }
    return;
  }

  // Reject application button
  if (e.target.classList.contains("reject-application")) {
    const applicationId = e.target.dataset.id;
    if (!confirm("Reject this application?")) return;

    try {
      const res = await fetch(`/applications/${applicationId}/reject`, {
        method: "PATCH",
        headers: API_HEADERS(),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to reject application");
        return;
      }

      loadAdminApplications();
    } catch (err) {
      console.error("Error rejecting application:", err);
      alert("Failed to reject application.");
    }
    return;
  }

});

// ==========================
// OPEN EDIT FORM (Prefill and show the form for editing)
// ==========================
async function openEditForm(requestId) {
  try {
    // Fetch user's requests to find the specific one
    const res = await fetch("/requests/my", { headers: API_HEADERS() });
    if (!res.ok) {
      alert("Failed to fetch your requests");
      return;
    }
    const requests = await res.json();
    const request = requests.find((r) => r.id === Number(requestId));

    if (!request) {
      alert("Request not found");
      return;
    }

    if (request.type === "job_listing") {
      // Prefill job form
      document.getElementById("jobRequestId").value = request.id;
      document.getElementById("jobTitle").value = request.title;
      document.getElementById("jobDescription").value = request.description;
      document.getElementById("hourlyRate").value = request.hourly_rate || "";

      // Clear file input (cannot set file programmatically)
      document.getElementById("jobImage").value = "";

      // Toggle buttons
      document.getElementById("jobSubmitBtn").textContent = "Update Job Request";
      document.getElementById("jobCancelEditBtn").style.display = "inline-block";

      // Scroll to form (optional)
      document.getElementById("jobRequestForm").scrollIntoView({ behavior: "smooth" });
    } else if (request.type === "store") {
      // Prefill store form
      document.getElementById("storeRequestId").value = request.id;
      document.getElementById("storeTitle").value = request.title;
      document.getElementById("storeDescription").value = request.description;
      document.getElementById("price").value = request.price || "";
      document.getElementById("storeSubcategory").value = request.subcategory || "";

      document.getElementById("storeImage").value = "";

      document.getElementById("storeSubmitBtn").textContent = "Update Store Request";
      document.getElementById("storeCancelEditBtn").style.display = "inline-block";

      document.getElementById("storeRequestForm").scrollIntoView({ behavior: "smooth" });
    } else {
      alert("Editing not supported for this request type.");
    }
  } catch (err) {
    console.error("Error opening edit form:", err);
    alert("Failed to open edit form.");
  }
}

// ==========================
// CANCEL EDIT FUNCTIONS
// ==========================
function cancelJobEdit() {
  resetJobForm();
}

function cancelStoreEdit() {
  resetStoreForm();
}

// ==========================
// RESET FORMS
// ==========================
function resetJobForm() {
  const form = document.getElementById("jobRequestForm");
  form.reset();
  document.getElementById("jobRequestId").value = "";
  document.getElementById("jobSubmitBtn").textContent = "Submit Job Request";
  document.getElementById("jobCancelEditBtn").style.display = "none";
}

function resetStoreForm() {
  const form = document.getElementById("storeRequestForm");
  form.reset();
  document.getElementById("storeRequestId").value = "";
  document.getElementById("storeSubmitBtn").textContent = "Submit Store Request";
  document.getElementById("storeCancelEditBtn").style.display = "none";
}

// ==========================
// SUBMIT JOB REQUEST (CREATE or UPDATE)
// ==========================
async function submitJobRequest(e) {
  e.preventDefault();

  const requestId = document.getElementById("jobRequestId").value;
  const formData = new FormData(e.target);
  formData.append("type", "job_listing");

  let url, method;

  if (requestId) {
    // UPDATE existing request
    url = `/requests/${requestId}`;
    method = "PUT";
  } else {
    // CREATE new request
    url = "/requests/create";
    method = "POST";
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        // DO NOT set Content-Type with FormData
      },
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json();
      alert("Failed to submit job request: " + (errData.message || "Unknown error"));
      return;
    }

    if (requestId) resetJobForm();
    else e.target.reset();

    loadUserRequests();
  } catch (err) {
    console.error("Error submitting job request:", err);
    alert("Failed to submit job request.");
  }
}

// ==========================
// SUBMIT STORE REQUEST (CREATE or UPDATE)
// ==========================
async function submitStoreRequest(e) {
  e.preventDefault();

  const requestId = document.getElementById("storeRequestId").value;
  const formData = new FormData();

  // Always send fields explicitly
  formData.append("title", document.getElementById("storeTitle").value);
  formData.append("description", document.getElementById("storeDescription").value);
  formData.append("price", document.getElementById("price").value);
  formData.append("subcategory", document.getElementById("storeSubcategory").value);

  const imageFile = document.getElementById("storeImage").files[0];
  if (imageFile) {
    formData.append("image", imageFile);
  }

  let url, method;

  if (requestId) {
    // UPDATE
    url = `/requests/${requestId}`;
    method = "PUT";
  } else {
    // CREATE
    formData.append("type", "store"); // ONLY for create
    url = "/requests/create";
    method = "POST";
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.message || "Failed to submit store request");
      return;
    }

    if (requestId) resetStoreForm();
    else e.target.reset();

    loadUserRequests();
  } catch (err) {
    console.error("Error submitting store request:", err);
    alert("Failed to submit store request.");
  }
}

// ==========================
// LOGOUT
// ==========================
function logout() {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
}

// ==========================
// PLACEHOLDER FUNCTIONS
// ==========================
// Implement your existing functions for applications and admin views here...

function formatStatus(status) {
  if (status === "accepted") return `<span style="color:green;">Accepted</span>`;
  if (status === "rejected") return `<span style="color:red;">Rejected</span>`;
  return `<span style="color:orange;">Pending</span>`;
}

async function loadUserApplications() {
  try {
    const res = await fetch("/applications/user", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load user applications");
      return;
    }

    const applications = await res.json();
    const tbody = document.getElementById("userApplications");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (applications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No applications received yet.</td></tr>`;
      return;
    }

    applications.forEach((app) => {
      const submittedDate = new Date(app.submitted_at).toLocaleString();

      if (app.status === "pending") {
        actionButtons = `
          <button class="accept-application" data-id="${app.id}">Accept</button>
          <button class="reject-application" data-id="${app.id}">Reject</button>
          <button class="delete-application" data-id="${app.id}">Delete</button>
        `;
      } else {
        actionButtons = `
          <strong>${(app.status || "pending").toUpperCase()}</strong>
          <button class="delete-application" data-id="${app.id}">Delete</button>
        `;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.job_title}</td>
        <td>${app.applicant_name}</td>
        <td>${app.applicant_email}</td>
        <td>${submittedDate}</td>
        <td>
          <a href="${app.resume_path}" target="_blank" rel="noopener noreferrer">
            View Resume
          </a>
        </td>
        <td>${actionButtons}</td>
      `;

      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading user applications:", err);
  }
}

async function loadAdminPendingRequests() {
  try {
    const res = await fetch("/requests/pending", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load admin pending requests");
      return;
    }

    const requests = await res.json();
    const tbody = document.getElementById("adminRequests");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No pending requests found.</td></tr>`;
      return;
    }

    requests.forEach((r) => {
      let details = "";

      if (r.type === "job_listing") {
        details = `₱${r.hourly_rate}/hr`;
      } else if (r.type === "store") {
        details = `₱${r.price} (${r.subcategory})`;
      } else if (r.type === "service_avail") {
        details = ""; // no peso or price for service avail
      } else {
        details = "";
      }

      const imageHtml = r.image
        ? `<img src="${r.image}" style="max-width:80px; display:block; margin-top:5px;">`
        : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.username}</td>
        <td>${r.type}</td>
        <td>
          <strong>${r.title}</strong><br>
          ${details}<br>
          ${imageHtml}
        </td>
        <td>
          <button class="accept-request" onclick="approveRequest(${r.id})">Approve</button>
          <button class="reject-request" onclick="rejectRequest(${r.id})">Reject</button>
          <button class="delete-request" data-id="${r.id}">Delete</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loading admin pending requests:", err);
  }
}

async function loadAdminAllRequests() {
  try {
    const res = await fetch("/requests/admin/all", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load all posts");
      return;
    }

    const posts = await res.json();
    const tbody = document.getElementById("adminAllPosts");
    if (!tbody) return;

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
          : `<button class="editing-request" onclick='openAdminEdit(${JSON.stringify(p)})'>Edit</button> 
              <button class="delete-request" data-id="${p.id}">Delete</button>`;

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
  } catch (err) {
    console.error("Error loading admin all posts:", err);
  }
}

async function loadAdminApplications() {
  try {
    const res = await fetch("/applications/admin", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load admin applications");
      return;
    }

    const applications = await res.json();
    const tbody = document.getElementById("adminApplications");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (applications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No applications found.</td></tr>`;
      return;
    }

    applications.forEach((app) => {
      const submittedDate = new Date(app.submitted_at).toLocaleString();

      let actionButtons = "";

      if (app.status === "pending") {
        actionButtons = `
          <button class="accept-application" data-id="${app.id}">Accept</button>
          <button class="reject-application" data-id="${app.id}">Reject</button>
          <button class="delete-application" data-id="${app.id}">Delete</button>
        `;
      } else {
        actionButtons = `
          <strong>${(app.status || "pending").toUpperCase()}</strong>
          <button class="delete-application" data-id="${app.id}">Delete</button>
        `;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.job_title}</td>
        <td>${app.applicant_name}</td>
        <td>${app.applicant_email}</td>
        <td>${submittedDate}</td>
        <td>
          <a href="${app.resume_path}" target="_blank" rel="noopener noreferrer">
            View Resume
          </a>
        </td>
        <td>${actionButtons}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loading admin applications:", err);
  }
}

async function loadServiceAvailJobsDropdown() {
  try {
    const res = await fetch("/requests/jobs/approved", { headers: API_HEADERS() });
    if (!res.ok) {
      console.error("Failed to load approved jobs for service avail dropdown");
      return;
    }

    const jobs = await res.json();
    const select = document.getElementById("parentJobId");
    if (!select) return;

    // Clear existing options except placeholder
    select.innerHTML = `<option value="">--Select a Job--</option>`;

    jobs.forEach(job => {
      const option = document.createElement("option");
      option.value = job.id;
      option.textContent = `${job.title} (posted by ${job.username || 'Unknown'})`;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading service avail jobs dropdown:", err);
  }
}

// ==========================
// ADMIN EDIT MODAL
// ==========================
function openAdminEdit(post) {
  adminEditModal.style.display = "flex";

  adminEditId.value = post.id;
  adminEditTitle.value = post.title;
  adminEditDescription.value = post.description;

  adminEditHourlyRate.style.display = "none";
  adminEditPrice.style.display = "none";
  adminEditSubcategory.style.display = "none";
  adminEditImage.style.display = "none"

  if (post.type === "job_listing") {
    adminEditHourlyRate.style.display = "block";
    adminEditHourlyRate.value = post.hourly_rate;
    adminEditImage.style.display = "none"
  } 
  else if (post.type === "service_avail") {
    adminEditHourlyRate.style.display = "none";
    adminEditPrice.style.display = "none";
    adminEditSubcategory.style.display = "none";
    adminEditImage.style.display = "none"
  } else {
    adminEditPrice.style.display = "block";
    adminEditSubcategory.style.display = "block";
    adminEditImage.style.display = "block";
    adminEditPrice.value = post.price;
    adminEditSubcategory.value = post.subcategory;
    adminEditImage.value = post.image;
  }
}

function closeAdminEdit() {
  adminEditModal.style.display = "none";
  adminEditForm.reset();
}


// ==========================
// ADMIN EDIT SUBMIT
// ==========================
adminEditForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = adminEditId.value;
  const fd = new FormData();

  fd.append("title", adminEditTitle.value);
  fd.append("description", adminEditDescription.value);

  if (adminEditHourlyRate.style.display === "block") {
    fd.append("hourly_rate", adminEditHourlyRate.value);
  }

  if (adminEditPrice.style.display === "block") {
    fd.append("price", adminEditPrice.value);
    fd.append("subcategory", adminEditSubcategory.value);
  }

  if (adminEditImage.files[0]) {
    fd.append("image", adminEditImage.files[0]);
  }

  await fetch(`/requests/admin/${id}`, {
    method: "PUT",
    headers: API_HEADERS(),
    body: fd,
  });

  closeAdminEdit();
  loadAdminAllRequests();
});

// ==========================
// ADMIN APPROVE / REJECT
// ==========================
async function approveRequest(requestId) {
  if (!confirm("Approve this request?")) return;

  try {
    const res = await fetch(`/requests/admin/${requestId}/approve`, {
      method: "PUT",
      headers: API_HEADERS(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to approve request");
      return;
    }

    loadAdminPendingRequests();
    loadAdminAllRequests();
  } catch (err) {
    console.error("Error approving request:", err);
    alert("Failed to approve request.");
  }
}

async function rejectRequest(requestId) {
  if (!confirm("Reject this request?")) return;

  try {
    const res = await fetch(`/requests/admin/${requestId}/reject`, {
      method: "PUT",
      headers: API_HEADERS(),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Failed to reject request");
      return;
    }

    loadAdminPendingRequests();
    loadAdminAllRequests();
  } catch (err) {
    console.error("Error rejecting request:", err);
    alert("Failed to reject request.");
  }
}
