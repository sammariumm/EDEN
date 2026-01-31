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
