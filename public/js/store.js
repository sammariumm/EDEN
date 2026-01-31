import { addToCart, getCartItemCount } from "./cartUtils.js";

document.addEventListener("DOMContentLoaded", () => {
  const storeContainer = document.getElementById("store-items");
  const subcategorySelect = document.getElementById("subcategory-filter");
  const storeSearchInput = document.getElementById("store-search");

  updateCartCount();
  loadStoreItems();

  function reloadStore() {
    loadStoreItems(subcategorySelect.value, storeSearchInput.value);
  }

  subcategorySelect.addEventListener("change", reloadStore);
  storeSearchInput.addEventListener("input", reloadStore);

  async function loadStoreItems(subcategory = "all", searchTerm = "") {
    try {
      let url = "/requests/approved";
      const params = [];
      if (subcategory !== "all") {
        params.push(`subcategory=${encodeURIComponent(subcategory)}`);
      }
      if (searchTerm.trim()) {
        params.push(`search=${encodeURIComponent(searchTerm.trim())}`);
      }
      if (params.length > 0) {
        url += "?" + params.join("&");
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch store items");

      const items = await res.json();
      const storeItems = items.filter(item => item.type === "store");

      storeContainer.innerHTML = "";

      if (storeItems.length === 0) {
        storeContainer.innerHTML = "<p>No store items found.</p>";
        return;
      }

      storeItems.forEach(item => {
        const price = Number(item.price);
        const card = document.createElement("div");
        card.className = "store-card";

        card.innerHTML = `
          <img src="${item.image ?? '/images/placeholder.png'}">
          <h3>${item.title}</h3>
          <p>${item.description ?? ""}</p>
          <p><strong>Price:</strong> ₱${(price / 10).toFixed(2)}</p>
          <button class="add-to-cart-btn"
            data-id="${item.id}"
            data-title="${item.title}"
            data-price="${price}"
            data-image="${item.image ?? '/images/placeholder.png'}">
            Add to Cart
          </button>
        `;

        storeContainer.appendChild(card);
      });

      document.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", () => {
          addToCart({
            id: button.dataset.id,
            title: button.dataset.title,
            price: Number(button.dataset.price),
            image: button.dataset.image
          });
          updateCartCount();
        });
      });

    } catch (err) {
      console.error(err);
      storeContainer.innerHTML = "<p>Failed to load store items.</p>";
    }
  }

  function updateCartCount() {
    const el = document.getElementById("cart-count");
    if (!el) return;
    el.textContent = getCartItemCount();
  }
});
