import { getCart, removeFromCart, getCartTotal } from "./cartUtils.js";

function renderCart() {
  const cart = getCart();
  const container = document.getElementById("cart-items");
  const totalEl = document.getElementById("cart-total");

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "";
    return;
  }

  cart.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-row";

    row.innerHTML = `
      <img src="${item.image}">
      <span>${item.title}</span>
      <span>₱${item.price}</span>
      <span>x${item.quantity}</span>
      <button>Remove</button>
    `;

    row.querySelector("button").onclick = () => {
      removeFromCart(item.id);
      renderCart();
    };

    container.appendChild(row);
  });

  totalEl.textContent = `Total: ₱${getCartTotal()}`;
}

window.checkout = () => {
  alert("Payment coming soon!");
};

document.addEventListener("DOMContentLoaded", renderCart);
