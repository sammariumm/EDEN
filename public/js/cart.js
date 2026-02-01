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

  console.log("Loaded cart:", cart);

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
        <div class="cart-item-price">₱${((item.price / 10) * item.quantity).toFixed(2)}</div>
        <button class="remove-btn" data-index="${index}">Remove</button>
      </div>
    `;

    cartItemsContainer.appendChild(card);
  });

  attachCartEvents();
  updateTotals();
}

function attachCartEvents() {
  // Remove item
  document.querySelectorAll(".remove-btn").forEach(btn => {
  btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      const card = btn.closest('.cart-item-card');

      if (!card) return;

      // Calculate the exact height + gap for offset (before animation starts)
      const containerStyle = getComputedStyle(cartItemsContainer);
      const gap = parseFloat(containerStyle.rowGap || containerStyle.gap || '0'); // fallback
      const removedHeight = card.offsetHeight + gap;

      // Step 1: Animate the card being removed (slide left + fade)
      card.classList.add('removing');

      // Wait for removal animation to finish
      setTimeout(() => {
          // Remove from data
          cart.splice(index, 1);
          saveCart(cart);

          // Step 2: Re-render the list (creates new cards without the removed one)
          renderCart();

          // Step 3: Immediately after render, apply sliding-up to affected cards with stagger
          const allCards = cartItemsContainer.querySelectorAll('.cart-item-card');
          const affectedCards = Array.from(allCards).slice(index); // cards from index onward
          const staggerDelay = 50; // ms between each card's animation start (adjust for feel: 30-100ms)

          // Set initial offsets with no transition (instant)
          affectedCards.forEach(card => {
              card.classList.add('no-transition');
              card.style.transform = `translateY(${removedHeight}px)`;
              void card.offsetHeight; // force reflow (instant due to no-transition)
              card.classList.remove('no-transition');
          });

          // Now, animate back to normal with stagger (transition is active from base styles)
          affectedCards.forEach((card, i) => {
              setTimeout(() => {
                  requestAnimationFrame(() => {
                      card.style.transform = '';
                  });
              }, i * staggerDelay);
          });

          // Optional cleanup: Remove inline styles after all animations (match transition + max stagger)
          const maxAnimationTime = 600 + (affectedCards.length - 1) * staggerDelay;
          setTimeout(() => {
              affectedCards.forEach(card => {
                  card.style.transform = '';
              });
          }, maxAnimationTime);

          updateCartCount();

      }, 500);  // match your removal animation duration (0.5s)
    });
  });

  // Quantity change via input
  document.querySelectorAll("input[type='number']").forEach(input => {
    input.addEventListener("change", () => {
      const index = parseInt(input.dataset.index);
      const newQty = Math.max(1, parseInt(input.value) || 1);
      cart[index].quantity = newQty;
      saveCart(cart);
      renderCart();           // re-render to update price
      updateCartCount();
    });
  });

  // +/- buttons
  document.querySelectorAll(".qty-decrease").forEach(btn => {
    btn.addEventListener("click", () => changeQuantity(btn.dataset.index, -1));
  });

  document.querySelectorAll(".qty-increase").forEach(btn => {
    btn.addEventListener("click", () => changeQuantity(btn.dataset.index, 1));
  });
}

function changeQuantity(index, delta) {
  index = parseInt(index);
  let qty = cart[index].quantity + delta;
  if (qty < 1) qty = 1;
  cart[index].quantity = qty;
  saveCart(cart);
  renderCart();
  updateCartCount();
}

function updateTotals() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price / 10 * item.quantity), 0);

  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  subtotalEl.textContent = `₱${subtotal.toFixed(2)}`;
  document.getElementById("tax").textContent = `₱${tax.toFixed(2)}`;
  totalEl.textContent = `₱${total.toFixed(2)}`;
}
