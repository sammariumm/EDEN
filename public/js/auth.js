const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const formTitle = document.getElementById("formTitle");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const registerUsername = document.getElementById("registerUsername");
const registerPassword = document.getElementById("registerPassword");

document.getElementById("showRegister").onclick = () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    formTitle.textContent = "Create Account";
};

document.getElementById("showLogin").onclick = () => {
    registerForm.style.display = "none";
    loginForm.style.display = "block";
    formTitle.textContent = "Login";
};

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login.html"; // Adjust if your login page URL differs
}

// LOGIN
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = loginUsername.value;
    const password = loginPassword.value;

    const res = await fetch("/auth/login", {  // Updated endpoint with /auth prefix
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Login failed");
        return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard.html";
});

// REGISTER
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = registerUsername.value;
    const password = registerPassword.value;

    const res = await fetch("/auth/register", {  // Updated endpoint with /auth prefix
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
    }

    localStorage.setItem("token", data.token);
    window.location.href = "/dashboard.html";
});
