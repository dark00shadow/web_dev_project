/* products.js - Specific logic for products page */

/* ── Season icon helper ── */
function seasonIcon(season) {
    return season === "Winter" ? "❄️" : "☀️";
}

/* ── Render a single product card ── */
function renderCard(product) {
    const seasonClass = product.season.toLowerCase();
    return `
      <article class="product-card" data-season="${product.season}" data-category="${product.category}">
        <div class="product-image">
          <img
            src="${product.image}"
            alt="${product.name}"
            onerror="this.parentElement.innerHTML='${seasonIcon(product.season)}'"
          >
        </div>
        <div class="product-body">
          <span class="product-category">${product.category}</span>
          <span class="season-badge ${seasonClass}">${product.season}</span>
          <h2 class="product-name">${product.name}</h2>
          <p class="product-description">${product.description}</p>
          <div class="product-footer">
            <span class="product-price">$${product.price.toFixed(2)}</span>
            <div class="cart-action">
              <button class="add-to-cart-btn" ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              <span class="stock-info ${product.stock > 0 && product.stock < 5 ? 'low-stock' : ''}">
                ${product.stock > 0 && product.stock < 5 ? 'Low Stock: ' + product.stock : 'Stock: ' + product.stock}
              </span>
            </div>
          </div>
        </div>
      </article>
    `;
}

/* ── Load products from data.json and render grid ── */
let allProducts = [];

fetch("data.json")
    .then(response => response.json())
    .then(data => {
        allProducts = data.products;
        renderGrid("all");
    })
    .catch(err => {
        const grid = document.getElementById("products-grid");
        if (grid) {
            grid.innerHTML = '<p class="empty-state">Could not load products. Please try again later.</p>';
        }
        console.error("Failed to load data.json:", err);
    });

/* ── Filter & render the grid ── */
function renderGrid(filter) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    const filtered = filter === "all"
        ? allProducts
        : allProducts.filter(p => p.season === filter || p.category === filter);

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">No products found for this filter.</p>';
        return;
    }

    grid.innerHTML = filtered.map(renderCard).join("");
}

/* ── Filter button click handler ── */
window.addEventListener('DOMContentLoaded', () => {
    const filterBar = document.getElementById("filter-bar");
    if (filterBar) {
        filterBar.addEventListener("click", function (e) {
            const btn = e.target.closest(".filter-btn");
            if (!btn) return;

            /* Update active state */
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterValue = btn.dataset.filter;

            /* Hook to theme engine (from common.js) */
            if (filterValue === "Summer" || filterValue === "summer") {
                if (typeof setTheme === "function") setTheme("summer");
            } else if (filterValue === "Winter" || filterValue === "winter") {
                if (typeof setTheme === "function") setTheme("winter");
            }

            renderGrid(filterValue);
        });
    }
});
