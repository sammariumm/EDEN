// ==========================
// CONFIG
// ==========================
const API_HEADERS = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("token")}`
});

// ==========================
// ENTRY POINT
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

// ==========================
// DASHBOARD LOADER
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

        document.getElementById("welcome").textContent =
            `Welcome, ${user.username}`;

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
// DASHBOARD SWITCHING
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
// USER DASHBOARD
// ==========================
async function loadUserRequests() {
    const res = await fetch("/requests/my", {
        headers: API_HEADERS()
    });

    const requests = await res.json();
    const list = document.getElementById("userRequests");

    list.innerHTML = "";

    requests.forEach(r => {
        const li = document.createElement("li");
        li.textContent = `${r.type} — ${r.status}`;
        list.appendChild(li);
    });
}

async function createRequest(type) {
    await fetch("/requests/create", {
        method: "POST",
        headers: API_HEADERS(),
        body: JSON.stringify({ type })
    });

    loadUserRequests();
}

// ==========================
// ADMIN DASHBOARD
// ==========================
async function loadAdminRequests() {
    const res = await fetch("/requests/pending", {
        headers: API_HEADERS()
    });

    const rows = await res.json();
    const tbody = document.getElementById("adminRequests");

    tbody.innerHTML = "";

    rows.forEach(r => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${r.username}</td>
            <td>${r.type}</td>
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
// AUTH UTILITIES
// ==========================
function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}
