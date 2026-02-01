import {
  loadCart,
  saveCart,
  updateCartCount
} from "./cartUtils.js";

/* =========================
   DOM REFERENCES
========================= */
const cartItemsContainer = document.getElementById("cart-items");
const emptyCartMsg = document.getElementById("empty-cart-message");
const checkoutBtn = document.getElementById("checkout-btn");
const subtotalEl = document.getElementById("subtotal");
const taxEl = document.getElementById("tax");
const totalEl = document.getElementById("total");
const paymentForm = document.getElementById("payment-form");
const gcashBtn = document.getElementById("gcash-pay-btn");

let cart = [];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartCount();

  if (gcashBtn) {
    gcashBtn.addEventListener("click", payWithGCash);
  }
});

/* =========================
   CART RENDERING
========================= */
function renderCart() {
  cart = loadCart();
  cartItemsContainer.innerHTML = "";

  if (cart.length === 0) {
    emptyCartMsg.style.display = "block";
    checkoutBtn.disabled = true;
    gcashBtn.disabled = true;
    updateTotals();
    return;
  }

  emptyCartMsg.style.display = "none";
  checkoutBtn.disabled = false;
  gcashBtn.disabled = false;

  cart.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "cart-item-card";

    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.title}</div>
        <div class="cart-item-quantity">
          <button type="button" class="qty-decrease" data-index="${index}">-</button>
          <input type="number" min="1" value="${item.quantity}" data-index="${index}">
          <button type="button" class="qty-increase" data-index="${index}">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">
          ₱${((item.price / 10) * item.quantity).toFixed(2)}
        </div>
        <button class="remove-btn" data-index="${index}">Remove</button>
      </div>
    `;

    cartItemsContainer.appendChild(card);
  });

  attachCartEvents();
  updateTotals();
}

/* =========================
   CART EVENTS
========================= */
function attachCartEvents() {

  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      const card = btn.closest(".cart-item-card");
      if (!card) return;

      card.classList.add("removing");

      setTimeout(() => {
        cart.splice(index, 1);
        saveCart(cart);
        renderCart();
        updateCartCount();
      }, 500);
    });
  });

  document.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener("change", () => {
      const index = parseInt(input.dataset.index);
      const qty = Math.max(1, parseInt(input.value) || 1);
      cart[index].quantity = qty;
      saveCart(cart);
      renderCart();
      updateCartCount();
    });
  });

  document.querySelectorAll(".qty-decrease").forEach(btn => {
    btn.addEventListener("click", () => changeQuantity(btn.dataset.index, -1));
  });

  document.querySelectorAll(".qty-increase").forEach(btn => {
    btn.addEventListener("click", () => changeQuantity(btn.dataset.index, 1));
  });
}

function changeQuantity(index, delta) {
  index = parseInt(index);
  cart[index].quantity = Math.max(1, cart[index].quantity + delta);
  saveCart(cart);
  renderCart();
  updateCartCount();
}

/* =========================
   TOTALS
========================= */
function updateTotals() {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price / 10) * item.quantity,
    0
  );

  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
  taxEl.textContent = `₱${tax.toFixed(2)}`;
  totalEl.textContent = `₱${total.toFixed(2)}`;
}

function getTotalAmount() {
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price / 10) * item.quantity,
    0
  );
  return subtotal + subtotal * 0.12;
}

/* =========================
   CARD CHECKOUT
========================= */
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

  if (!/^\d{16}$/.test(cardNumber)) {
    alert("Invalid card number.");
    return;
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    alert("Invalid CVV.");
    return;
  }

  const [year, month] = expiry.split("-");
  if (new Date(year, month) < new Date()) {
    alert("Card has expired.");
    return;
  }

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price / 10) * item.quantity,
    0
  );

  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  try {
    const res = await fetch("/orders/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        cart,
        totals: { subtotal, tax, total }
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Checkout failed");

    alert("Order placed successfully!");

    localStorage.removeItem("eden_cart");
    renderCart();
    updateCartCount();
    paymentForm.reset();

  } catch (err) {
    console.error(err);
    alert("Server error during checkout.");
  }
});

/* =========================
   GCASH PAYMONGO
========================= */
async function payWithGCash() {
  if (cart.length === 0) return;

  const amount = Math.round(getTotalAmount() * 100); // centavos
  const currency = "PHP";

  try {
    const res = await fetch("/api/payments/paymongo/gcash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency })
    });

    const data = await res.json();
    if (!res.ok || !data.checkout_url) {
      throw new Error("Failed to initiate GCash payment");
    }

    window.location.href = data.checkout_url;

  } catch (err) {
    console.error(err);
    alert("GCash payment failed. Please try again.");
  }
}
