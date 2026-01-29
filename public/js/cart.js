// cart.js

document.addEventListener("DOMContentLoaded", () => {
  const cartItemsContainer = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");
  const checkoutBtn = document.getElementById("checkout-btn");
  const paymentForm = document.getElementById("payment-form");
  const emptyCartMsg = document.getElementById("empty-cart-message");
  const cardNumberInput = document.getElementById("card-number");
  const emailInput = document.getElementById("email");

  // Format card number input
  cardNumberInput?.addEventListener("input", () => {
    cardNumberInput.value = cardNumberInput.value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  });

  let cart = loadCart();
  renderCart();

  // ----------------------------
  // Load & Save Cart
  // ----------------------------
  function loadCart() {
    const stored = localStorage.getItem("cart");
    if (!stored) return [];

    try {
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter(
            i =>
              i &&
              i.id &&
              i.title &&
              typeof i.price === "number" &&
              typeof i.quantity === "number"
          )
        : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // ----------------------------
  // Render Cart
  // ----------------------------
  function renderCart() {
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      emptyCartMsg.style.display = "block";
      checkoutBtn.disabled = true;
      updateTotals();
      return;
    }

    emptyCartMsg.style.display = "none";

    cart.forEach((item, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "cart-item";

      const priceDisplay = (item.price / 10).toFixed(2);

      itemDiv.innerHTML = `
        <img src="${item.image || "/images/placeholder.png"}" alt="${item.title}">
        <div class="item-details">
          <div class="item-title">${item.title}</div>
          <div>Price: ₱${priceDisplay}</div>
          <div class="item-qty">
            Quantity:
            <button class="qty-decrease">-</button>
            <span>${item.quantity}</span>
            <button class="qty-increase">+</button>
          </div>
        </div>
        <div class="item-actions">
          <button class="remove-btn">Remove</button>
        </div>
      `;

      itemDiv.querySelector(".qty-decrease").onclick = () => {
        if (item.quantity > 1) {
          item.quantity--;
          saveCart();
          renderCart();
        }
      };

      itemDiv.querySelector(".qty-increase").onclick = () => {
        item.quantity++;
        saveCart();
        renderCart();
      };

      itemDiv.querySelector(".remove-btn").onclick = () => {
        cart.splice(index, 1);
        saveCart();
        renderCart();
      };

      cartItemsContainer.appendChild(itemDiv);
    });

    updateTotals();
    checkoutBtn.disabled = !paymentForm.checkValidity();
  }

  // ----------------------------
  // Totals
  // ----------------------------
  function updateTotals() {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    subtotalEl.textContent = (subtotal / 10).toFixed(2);
    taxEl.textContent = (tax / 10).toFixed(2);
    totalEl.textContent = (total / 10).toFixed(2);
  }

  paymentForm.addEventListener("input", () => {
    checkoutBtn.disabled = !paymentForm.checkValidity() || cart.length === 0;
  });

  // ----------------------------
  // Checkout → Send Email
  // ----------------------------
  paymentForm.addEventListener("submit", async (e) => {
  e.preventDefault();

      const email = document.getElementById("email").value.trim();

      if (!email) {
        alert("Email is required");
        return;
      }

      try {
        const res = await fetch("/orders/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            cart,
            total: totalEl.textContent
          })
        });

        if (!res.ok) throw new Error("Checkout failed");

        alert("Order placed! Receipt sent to email.");

        cart = [];
        localStorage.removeItem("cart");
        renderCart();
        paymentForm.reset();

      } catch (err) {
        console.error(err);
        alert("Checkout failed");
      }
    });

});
