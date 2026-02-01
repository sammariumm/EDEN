import {
  loadCart,
  saveCart,
  updateCartCount
} from "./cartUtils.js";

const cartItemsContainer = document.getElementById("cart-items");
const emptyCartMsg = document.getElementById("empty-cart-message"); // Fixed ID here
const checkoutBtn = document.getElementById("checkout-btn");
const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const paymentForm = document.getElementById("payment-form");

let cart = [];

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount();
});

function renderCart() {
  cart = loadCart();

  console.log("Loaded cart from eden_cart:", cart);

  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMsg.style.display = "block";
    checkoutBtn.disabled = true;
    updateTotals();
    return;
  }

  emptyCartMsg.style.display = "none";
  checkoutBtn.disabled = false;

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row";

    row.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <span class="title">${item.title}</span>
      <input type="number" min="1" value="${item.quantity}" data-index="${index}">
      <span class="price">₱${((item.price * item.quantity) / 10).toFixed(2)}</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    `;

    cartItemsContainer.appendChild(row);
  });

  attachCartEvents();
  updateTotals();
}

function attachCartEvents() {
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = btn.dataset.index;
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });

  document.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener("change", () => {
      const index = input.dataset.index;
      const value = Math.max(1, Number(input.value));
      cart[index].quantity = value;
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });
}

function updateTotals() {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity) / 10,
    0
  );

  const tax = (subtotal * 0.12);
  const total = (subtotal + tax);

  subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
  document.getElementById("tax").textContent = `₱${tax.toFixed(2)}`;
  totalEl.textContent = `₱${total.toFixed(2)}`;
}

paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const email = document.getElementById("email").value.trim();
  const cardNumber = document.getElementById("card-number").value.trim();
  const expiry = document.getElementById("expiry").value;
  const cvv = document.getElementById("cvv").value.trim();

  // Client-side validation (format only)
  if (!/^\d{16}$/.test(cardNumber)) {
    alert("Invalid card number.");
    return;
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    alert("Invalid CVV.");
    return;
  }

  const [year, month] = expiry.split("-");
  const expiryDate = new Date(year, month);
  if (expiryDate < new Date()) {
    alert("Card has expired.");
    return;
  }

  // Prepare payload (DO NOT SEND CARD DATA)
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.quantity) / 10,
    0
  );
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  try {
    const res = await fetch("/orders/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        cart,
        totals: { subtotal, tax, total }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Checkout failed.");
      return;
    }

    alert("Order placed successfully! Receipt sent to your email.");

    localStorage.removeItem("eden_cart");
    renderCart();
    updateCartCount();
    paymentForm.reset();

  } catch (err) {
    console.error(err);
    alert("Server error during checkout.");
  }
});
