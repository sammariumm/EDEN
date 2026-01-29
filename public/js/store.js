document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("store-items");
  const subcategorySelect = document.getElementById("subcategoryFilter");

  // ⛔ Not on store page — exit silently
  if (!container) {
    console.warn("store.js loaded on a non-store page");
    return;
  }

  // Initial load
  loadStoreItems();

  // Subcategory filter (if present)
  if (subcategorySelect) {
    subcategorySelect.addEventListener("change", () => {
      loadStoreItems(subcategorySelect.value);
    });
  }
});

async function loadStoreItems(subcategory = "") {
  const container = document.getElementById("store-items");

  // Double safety
  if (!container) return;

  try {
    let url = "/requests/approved";

    if (subcategory) {
      url += `?subcategory=${encodeURIComponent(subcategory)}`;
    }

    console.log("Fetching:", url);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch store items");
    }

    const items = await res.json();
    container.innerHTML = "";

    // 🔒 HARD FILTER — store items only
    const storeItems = items.filter(item => item.type === "store");

    if (storeItems.length === 0) {
      container.innerHTML = "<p>No store items found.</p>";
      return;
    }

    storeItems.forEach(item => {
      const card = document.createElement("div");
      card.className = "store-card";

      card.innerHTML = `
        <img src="${item.image ?? '/images/placeholder.png'}" alt="${item.title}">
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <p class="price">₱${(item.price / 10).toFixed(2)}</p>
        <button class="add-to-cart" data-id="${item.id}">
          Add to Cart
        </button>
      `;

      container.appendChild(card);
    });

    document.querySelectorAll(".add-to-cart").forEach(btn => {
      btn.addEventListener("click", () => {
        addToCart(btn.dataset.id);
      });
    });

  } catch (err) {
    console.error("Store error:", err);
    container.innerHTML = "<p>Error loading store items.</p>";
  }
}

/* ==========================
   CART (localStorage)
   ========================== */
function addToCart(productId) {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.id === Number(productId));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: Number(productId),
      quantity: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Item added to cart");
}
