const subcategoryFilter = document.getElementById("subcategoryFilter");

async function loadStoreItems(subcategory = "") {
  try {
    let url = "/requests/approved";
    if (subcategory) {
      url += `?subcategory=${encodeURIComponent(subcategory)}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch store items");

    const items = await res.json();
    const container = document.getElementById("storeContainer");

    if (items.length === 0) {
      container.innerHTML = "<p>No approved items found.</p>";
      return;
    }

    container.innerHTML = ""; // Clear previous content

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";

      const imgSrc = item.image ? item.image : "https://via.placeholder.com/250x150?text=No+Image";

      card.innerHTML = `
        <img src="${imgSrc}" alt="${item.title}" />
        <div class="item-title">${item.title}</div>
        <div class="item-desc">${item.description}</div>
        <div class="item-price">
          ${item.price ? "$" + item.price.toFixed(2) : "Price not set"}
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    document.getElementById("storeContainer").innerHTML = "<p>Failed to load store items.</p>";
  }
}

// Initial load - no filter
loadStoreItems();

// Reload items when filter changes
subcategoryFilter.addEventListener("change", () => {
  loadStoreItems(subcategoryFilter.value);
});
