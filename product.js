/* catalog.js - Specific logic for catalog page */

/* ── Season icon helper ── */
function seasonIcon(season) {
    return season === "Winter" ? "❄️" : "☀️";
}

/* ── Render a single product card ── */
function renderCard(product) {
    const seasonClass = product.season.toLowerCase();
    const totalStock = product.sizes ? Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0) : 0;

    // Prepare size options for the back side
    const availableSizes = product.sizes ? Object.entries(product.sizes).filter(([_, qty]) => qty > 0) : [];
    const sizeButtons = availableSizes.map(([size, qty], idx) => 
        `<button type="button" class="size-btn ${idx === 0 ? 'active' : ''}" data-size="${size}" data-stock="${qty}">${size}</button>`
    ).join('');
    
    const firstSizeStock = availableSizes.length > 0 ? availableSizes[0][1] : 0;
    
    return `
      <div class="product-card-container" data-id="${product.id}">
        <div class="product-card-inner">
          
          <!-- Front Face -->
          <article class="product-card product-card-front" data-season="${product.season}" data-category="${product.category}">
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
                  <button class="btn-add-to-cart-trigger add-to-cart-btn" ${totalStock === 0 ? 'disabled' : ''}>
                    ${totalStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <div class="stock-info ${totalStock > 0 && totalStock < 5 ? 'low-stock' : ''}">
                    <span class="stock-label">${totalStock > 0 && totalStock < 5 ? 'Low Stock' : 'Stock'}</span>
                    <span class="stock-number">${totalStock}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <!-- Back Face -->
          <div class="product-card-back">
            <div class="back-header">
              <p class="back-product-name">${product.name}</p>
            </div>
            <div class="selector-group">
              <label>Size:</label>
              <div class="size-options">${sizeButtons}</div>
            </div>
            <div class="selector-group">
              <label>Quantity:</label>
              <div class="qty-counter">
                <button type="button" class="qty-btn-flip minus">−</button>
                <input type="number" value="1" min="1" max="${firstSizeStock}" class="qty-input-flip" readonly>
                <button type="button" class="qty-btn-flip plus">+</button>
              </div>
              <span class="stock-hint">Available: <span class="size-stock-num">${firstSizeStock}</span></span>
            </div>
            <div class="back-actions">
              <button class="btn-confirm-cart">Confirm</button>
              <button class="btn-cancel-flip">Cancel</button>
            </div>
          </div>

        </div>
      </div>
    `;
}

/* ── Load products from product.json and render grid ── */
let allProducts = [];
let defaultMaxPrice = 500;

fetch("product.json")
    .then(response => response.json())
    .then(data => {
        allProducts = data.products;
        
        /* Initialize price range max based on data */
        const maxPriceInDB = Math.max(...allProducts.map(p => p.price));
        const roundedMax = Math.ceil(maxPriceInDB / 100) * 100;
        defaultMaxPrice = roundedMax;
        
        const priceMaxInput = document.getElementById("price-max");
        if (priceMaxInput) {
            priceMaxInput.value = roundedMax;
        }

        /* Check for initial search query from URL parameter */
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        const seasonQuery = urlParams.get('season');
        const categoryQuery = urlParams.get('category');
        
        if (searchQuery) {
            const searchInput = document.getElementById("navbar-search-input");
            if (searchInput) {
                searchInput.value = searchQuery;
            }
            filterProducts(searchQuery);
        } else if (seasonQuery || categoryQuery) {
            if (seasonQuery) {
                activeSeason = seasonQuery.charAt(0).toUpperCase() + seasonQuery.slice(1);
            }
            if (categoryQuery) {
                const validCats = ['Coats', 'Tops', 'Shirts', 'T-Shirts', 'Bottoms', 'Dresses', 'Accessories', 'Sportswear'];
                const match = validCats.find(c => c.toLowerCase() === categoryQuery.toLowerCase());
                if (match) activeCategories.add(match);
            }
            syncSidebarUI();
            renderGrid();
        } else {
            renderGrid("all");
        }
    })
    .catch(err => {
        const grid = document.getElementById("products-grid");
        if (grid) {
            grid.innerHTML = '<p class="empty-state">Could not load products. Please try again later.</p>';
        }
        console.error("Failed to load product.json:", err);
    });

/* ── Filter & render the grid ── */
let activeCategories = new Set();
let activeGenders = new Set();
let activeSizes = new Set();
let activeSeason = "all";

function getCurrentSeason() {
    // Returns "Summer" or "Winter" based on the current theme or date
    const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('preferred-theme');
    if (theme) {
        return theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    // Fallback to date-based season if no theme is set yet
    const month = new Date().getMonth();
    return (month >= 3 && month <= 8) ? "Summer" : "Winter";
}

function renderGrid(filterValue) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    // Update global state if filterValue is provided (from top bar)
    if (filterValue !== undefined) {
        activeSeason = filterValue === "all" ? "all" : filterValue;
    }

    const currentSeason = getCurrentSeason();
    
    // Get numeric price values
    const minPrice = parseFloat(document.getElementById("price-min")?.value) || 0;
    const maxPrice = parseFloat(document.getElementById("price-max")?.value) || Infinity;

    // 1. Filter the products
    let filtered = allProducts.filter(p => {
        const matchesSeason = activeSeason === "all" || p.season === activeSeason;
        const matchesCategory = activeCategories.size === 0 || activeCategories.has(p.category);
        // If a gender is selected, show matching gender OR unisex items. If no gender selected, show all.
        const matchesGender = activeGenders.size === 0 || activeGenders.has(p.gender) || p.gender === "unisex";
        const matchesPrice = p.price >= minPrice && p.price <= maxPrice;
        // Size filtering: Product must have at least one of the activeSizes in stock
        const matchesSize = activeSizes.size === 0 || 
            (p.sizes && Object.entries(p.sizes).some(([size, qty]) => activeSizes.has(size) && qty > 0));
        
        return matchesSeason && matchesCategory && matchesGender && matchesPrice && matchesSize;
    });

    // 2. Apply seasonal sorting to the filtered results
    filtered.sort((a, b) => {
        if (a.season === currentSeason && b.season !== currentSeason) return -1;
        if (a.season !== currentSeason && b.season === currentSeason) return 1;
        return 0;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-state">No products found for this filter.</p>';
        return;
    }

    grid.innerHTML = filtered.map(renderCard).join("");
}

function resetFilters() {
    // 1. Clear state
    activeCategories.clear();
    activeGenders.clear();
    activeSizes.clear();
    activeSeason = "all";

    // 2. Reset UI - Price Range
    const maxPriceInDB = Math.max(...allProducts.map(p => p.price));
    const roundedMax = Math.ceil(maxPriceInDB / 100) * 100;
    
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    if (priceMinInput) priceMinInput.value = 0;
    if (priceMaxInput) priceMaxInput.value = roundedMax;

    // 3. Reset UI - Top bar buttons
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (btn.dataset.filter === "all") {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    // 4. Sync Sidebar UI and re-render
    syncSidebarUI();
    renderGrid();
}

function toggleDropdown(id) {
    const content = document.getElementById(id);
    const btn = content?.previousElementSibling;
    
    if (content) {
        const isShowing = content.classList.toggle("show");
        if (btn) {
            btn.classList.toggle("open", isShowing);
        }
    }
}

function syncSidebarUI() {
    // Sync Seasons
    document.querySelectorAll('#season-filter-list .filter-item').forEach(item => {
        const season = item.dataset.season;
        if (activeSeason === season) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Sync Sizes
    document.querySelectorAll('#size-filter-list .filter-item').forEach(item => {
        const size = item.dataset.size;
        if (size === "all") {
            if (activeSizes.size === 0) item.classList.add("active");
            else item.classList.remove("active");
        } else if (activeSizes.has(size)) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Sync Categories
    document.querySelectorAll('#category-filter-list .filter-item').forEach(item => {
        const cat = item.dataset.category;
        if (activeCategories.has(cat)) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    // Sync Genders
    document.querySelectorAll('#gender-filter-list .filter-item').forEach(item => {
        const gen = item.dataset.gender;
        if (activeGenders.has(gen)) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

function handleSidebarCategoryClick(category, element) {
    if (activeCategories.has(category)) {
        activeCategories.delete(category);
        element.classList.remove("active");
    } else {
        activeCategories.add(category);
        element.classList.add("active");
    }

    syncSidebarUI();
    renderGrid();
}

function handleSidebarSizeClick(size, element) {
    if (size === "all") {
        activeSizes.clear();
    } else if (activeSizes.has(size)) {
        activeSizes.delete(size);
    } else {
        activeSizes.add(size);
    }
    syncSidebarUI();
    renderGrid();
}

function handleSidebarGenderClick(gender, element) {
    if (activeGenders.has(gender)) {
        activeGenders.delete(gender);
        element.classList.remove("active");
    } else {
        activeGenders.add(gender);
        element.classList.add("active");
    }
    syncSidebarUI();
    renderGrid();
}

/**
 * Specialized theme toggle handler for the products page.
 * Decouples theme changes from filtering, unless a specific seasonal filter is active.
 */
function onThemeToggle(newTheme) {
    const seasonLabel = newTheme.charAt(0).toUpperCase() + newTheme.slice(1);

    // If the active filter is specifically a season, toggle the filter along with the theme
    if (activeSeason === "Winter" || activeSeason === "Summer") {
        activeSeason = seasonLabel;

        // Sync top bar buttons to reflect the toggled season filter
        document.querySelectorAll(".filter-btn").forEach(btn => {
            const val = btn.dataset.filter;
            if (val === "Winter" || val === "Summer" || val === "all") {
                if (val === seasonLabel) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            }
        });

        syncSidebarUI();
    }

    setTheme(newTheme);
    renderGrid(); // Re-renders to update sorting based on the new theme
}

function handleSidebarSeasonClick(season, element) {
    activeSeason = season;
    
    // Hook to theme engine
    if (season === "Summer") {
        if (typeof setTheme === "function") setTheme("summer");
    } else if (season === "Winter") {
        if (typeof setTheme === "function") setTheme("winter");
    }

    syncSidebarUI();
    renderGrid();
}

/* ── Search & filter products ── */
function filterProducts(searchQuery) {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    if (!searchQuery || searchQuery.trim() === "") {
        renderGrid("all");
        return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    /* Advanced multi-keyword search logic */
    // 1. Identify available seasons and categories dynamically
    const availableSeasons = [...new Set(allProducts.map(p => p.season.toLowerCase()))];
    const availableCategories = [...new Set(allProducts.map(p => p.category.toLowerCase()))];
    
    // 2. Tokenize the query: split by spaces, "and", and commas
    // Filter out common small words that aren't useful for filtering
    const stopWords = ["and", "in", "the", "with", "for", "a", "an"];
    const tokens = query.split(/[\s,]+/)
        .filter(t => t.length > 0 && !stopWords.includes(t));
    
    // 3. Categorize tokens into Seasons, Categories, and general keywords
    const querySeasons = tokens.filter(t => availableSeasons.includes(t));
    const queryCategories = tokens.filter(t => availableCategories.includes(t));
    const queryOther = tokens.filter(t => !availableSeasons.includes(t) && !availableCategories.includes(t));
    
    const filtered = allProducts.filter(p => {
        // Must match at least one of the mentioned seasons (if any)
        const matchesSeason = querySeasons.length === 0 || 
            querySeasons.includes(p.season.toLowerCase());
            
        // Must match at least one of the mentioned categories (if any)
        const matchesCategory = queryCategories.length === 0 || 
            queryCategories.includes(p.category.toLowerCase());
            
        // Must match ALL other keywords in name, category, or description
        const matchesOther = queryOther.length === 0 || 
            queryOther.every(token => 
                p.name.toLowerCase().includes(token) || 
                p.description.toLowerCase().includes(token) ||
                p.category.toLowerCase().includes(token)
            );
        
        return matchesSeason && matchesCategory && matchesOther;
    });

    // Sort results by current season
    const currentSeason = getCurrentSeason();
    filtered.sort((a, b) => {
        if (a.season === currentSeason && b.season !== currentSeason) return -1;
        if (a.season !== currentSeason && b.season === currentSeason) return 1;
        return 0;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="empty-state">No products found matching "${searchQuery}".</p>`;
        return;
    }

    grid.innerHTML = filtered.map(renderCard).join("");
}

/* ── Initialise search and filter listeners ── */
window.addEventListener('DOMContentLoaded', () => {
    const filterBar = document.getElementById("filter-bar");
    if (filterBar) {
        filterBar.addEventListener("click", function (e) {
            const btn = e.target.closest(".filter-btn");
            if (!btn) return;

            /* Reset navbar search input since button was clicked */
            const searchInput = document.getElementById("navbar-search-input");
            if (searchInput) {
                searchInput.value = "";
            }

            const filterValue = btn.dataset.filter;

            /* Update active state for top bar */
            if (filterValue === "Winter" || filterValue === "Summer" || filterValue === "all") {
                document.querySelectorAll(".filter-btn").forEach(b => {
                    const val = b.dataset.filter;
                    if (val === "Winter" || val === "Summer" || val === "all") {
                        b.classList.remove("active");
                    }
                });
                btn.classList.add("active");
                
                // When switching seasons, we might want to keep or clear categories. 
                // Let's keep them for now as it's more flexible.
            } else {
                // Category button in top bar - Clear all and set only this one
                activeCategories.clear();
                activeCategories.add(filterValue);
                
                document.querySelectorAll(".filter-btn").forEach(b => {
                    const val = b.dataset.filter;
                    if (val !== "Winter" && val !== "Summer" && val !== "all") {
                        b.classList.remove("active");
                    }
                });
                btn.classList.add("active");
                
                // Sync sidebar to show only this category
                syncSidebarUI();
            }

            /* Hook to theme engine (from common.js) */
            if (filterValue === "Summer" || filterValue === "summer") {
                if (typeof setTheme === "function") setTheme("summer");
            } else if (filterValue === "Winter" || filterValue === "winter") {
                if (typeof setTheme === "function") setTheme("winter");
            }

            renderGrid(filterValue);
        });
    }

    /* Hook up Sidebar Seasons */
    const sidebarSeasonList = document.getElementById("season-filter-list");
    if (sidebarSeasonList) {
        sidebarSeasonList.addEventListener("click", (e) => {
            const item = e.target.closest(".filter-item");
            if (!item) return;
            
            const season = item.dataset.season;
            handleSidebarSeasonClick(season, item);
        });
    }

    /* Hook up Sidebar Sizes */
    const sidebarSizeList = document.getElementById("size-filter-list");
    if (sidebarSizeList) {
        sidebarSizeList.addEventListener("click", (e) => {
            const item = e.target.closest(".filter-item");
            if (!item) return;
            
            const size = item.dataset.size;
            handleSidebarSizeClick(size, item);
        });
    }

    /* Hook up Sidebar Categories */
    const sidebarCatList = document.getElementById("category-filter-list");
    if (sidebarCatList) {
        sidebarCatList.addEventListener("click", (e) => {
            const item = e.target.closest(".filter-item");
            if (!item) return;
            
            const category = item.dataset.category;
            handleSidebarCategoryClick(category, item);
        });
    }

    /* Hook up Sidebar Genders */
    const sidebarGenderList = document.getElementById("gender-filter-list");
    if (sidebarGenderList) {
        sidebarGenderList.addEventListener("click", (e) => {
            const item = e.target.closest(".filter-item");
            if (!item) return;
            
            const gender = item.dataset.gender;
            handleSidebarGenderClick(gender, item);
        });
    }

    /* Hook up Price Range synchronization */
    const priceMinInput = document.getElementById("price-min");
    const priceMaxInput = document.getElementById("price-max");
    
    if (priceMinInput) {
        priceMinInput.addEventListener("input", () => renderGrid());
    }
    if (priceMaxInput) {
        priceMaxInput.addEventListener("input", () => renderGrid());
    }

    /* Hook up Reset Button */
    const resetBtn = document.getElementById("reset-filters");
    if (resetBtn) {
        resetBtn.addEventListener("click", resetFilters);
    }

    /* Hook up navbar search */
    const searchForm = document.querySelector(".search-form");
    const searchInput = document.getElementById("navbar-search-input");

    if (searchInput) {
        // Real-time filtering as you type
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value;
            filterProducts(query);
            
            // Update URL without reload to preserve state
            const newUrl = query 
                ? `${window.location.pathname}?search=${encodeURIComponent(query)}`
                : window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        });
    }

    if (searchForm) {
        // Prevent page reload on submit when on products.html
        searchForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (searchInput) {
                filterProducts(searchInput.value);
            }
        });
    }

    /* Updated Add to Cart event delegation for Flipping Cards */
    const grid = document.getElementById("products-grid");
    if (grid) {
        grid.addEventListener("click", (e) => {
            const container = e.target.closest(".product-card-container");
            if (!container) return;

            const productId = container.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            if (!product) return;

            // Navigation to details page if clicking on the front (but not the button)
            if (e.target.closest(".product-card-front") && !e.target.closest(".btn-add-to-cart-trigger")) {
                window.location.href = `product-details.html?id=${productId}`;
                return;
            }

            // 1. Trigger Flip to Back
            if (e.target.closest(".btn-add-to-cart-trigger")) {
                container.classList.add("is-flipped");
            }

            // 2. Flip Back / Cancel Action
            if (e.target.closest(".btn-cancel-flip")) {
                container.classList.remove("is-flipped");
            }

            // 3. Confirm Selection & Add to Cart Logic
            if (e.target.closest(".btn-confirm-cart")) {
                const activeSizeBtn = container.querySelector(".size-btn.active");
                if (!activeSizeBtn) return;
                
                const selectedSize = activeSizeBtn.dataset.size;
                const qtyInput = container.querySelector(".qty-input-flip");
                const selectedQty = parseInt(qtyInput.value, 10);
                
                if (product.sizes[selectedSize] >= selectedQty) {
                    product.sizes[selectedSize] -= selectedQty;
                    addToLocalCart(product.id, product.name, selectedSize, selectedQty);
                    showToast(`Added ${selectedQty} × "${product.name}" (${selectedSize}) to cart.`);
                    renderGrid();
                }
            }

            // 4. Quantity Adjustments
            if (e.target.closest(".qty-btn-flip.plus")) {
                const input = container.querySelector(".qty-input-flip");
                const max = parseInt(input.getAttribute("max"), 10);
                let val = parseInt(input.value, 10);
                if (val < max) input.value = val + 1;
            }
            if (e.target.closest(".qty-btn-flip.minus")) {
                const input = container.querySelector(".qty-input-flip");
                let val = parseInt(input.value, 10);
                if (val > 1) input.value = val - 1;
            }

            // 5. Size Selection Toggle
            if (e.target.closest(".size-btn")) {
                const sizeBtn = e.target.closest(".size-btn");
                container.querySelectorAll(".size-btn").forEach(btn => btn.classList.remove("active"));
                sizeBtn.classList.add("active");
                
                const stock = parseInt(sizeBtn.dataset.stock, 10);
                const input = container.querySelector(".qty-input-flip");
                const hint = container.querySelector(".size-stock-num");
                
                input.setAttribute("max", stock);
                if (parseInt(input.value, 10) > stock) input.value = stock;
                if (hint) hint.textContent = stock;
            }
        });
    }

    // Safety cancellations on window release
});

// Removal of old modal helper functions as flipping card is now self-contained.
