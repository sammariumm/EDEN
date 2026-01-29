document.addEventListener("DOMContentLoaded", () => {
  const storeContainer = document.getElementById("store-items");
  const subcategorySelect = document.getElementById("subcategory-filter");

  // Load all store items initially
  loadStoreItems();

  // Listen for subcategory changes
  subcategorySelect.addEventListener("change", () => {
    const selected = subcategorySelect.value;
    loadStoreItems(selected);
  });

  async function loadStoreItems(subcategory = "all") {
    try {
      let url = "/requests/approved";

      // Append subcategory query if not "all"
      if (subcategory && subcategory !== "all") {
        url += `?subcategory=${encodeURIComponent(subcategory)}`;
      }

      console.log("Fetching:", url);

      const res = await fetch(url);

      if (!res.ok) {
        throw new Error("Failed to fetch store items");
      }

      const items = await res.json();

      // Filter on frontend to only show type 'store'
      const storeItems = items.filter(item => item.type === "store");

      if (storeItems.length === 0) {
        storeContainer.innerHTML = "<p>No store items found.</p>";
        return;
      }

      storeContainer.innerHTML = "";

      storeItems.forEach(item => {
        const price = Number(item.price);
        const formattedPrice = !isNaN(price) ? (price / 10).toFixed(2) : "N/A";

        const card = document.createElement("div");
        card.className = "store-card";

        card.innerHTML = `
          <img src="${item.image ?? '/images/placeholder.png'}" alt="${item.title}">
          <h3>${item.title}</h3>
          <p>${item.description ?? ""}</p>
          <p><strong>Price:</strong> ₱${formattedPrice}</p>
          <button class="add-to-cart-btn"
            data-id="${item.id}"
            data-title="${item.title}"
            data-price="${price}"
            data-image="${item.image ?? '/images/placeholder.png'}"
          >Add to Cart</button>
        `;

        storeContainer.appendChild(card);
      });

      // Add event listeners for Add to Cart buttons
      document.querySelectorAll(".add-to-cart-btn").forEach(button => {
        button.addEventListener("click", () => {
          addToCart({
            id: button.dataset.id,
            title: button.dataset.title,
            price: Number(button.dataset.price),
            image: button.dataset.image,
            quantity: 1
          });
        });
      });

    } catch (err) {
      console.error("Store error:", err);
      storeContainer.innerHTML = "<p>Failed to load store items.</p>";
    }
  }

  function addToCart(item) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(cartItem => cartItem.id === item.id);
    if (existing) {
      existing.quantity++;
    } else {
      cart.push(item);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`Added ${item.title} to cart.`);
    console.log("Current cart:", cart);
  }
});
