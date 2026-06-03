/* products.js - Specific logic for products page */

/* ── Season icon helper ── */
function seasonIcon(season) {
    return season === "Winter" ? "❄️" : "☀️";
}

/* ── Render a single product card ── */
function renderCard(product) {
    const seasonClass = product.season.toLowerCase();
    const totalStock = product.sizes ? Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0) : 0;
    
    return `
      <article class="product-card" data-id="${product.id}" data-season="${product.season}" data-category="${product.category}">
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
              <button class="add-to-cart-btn" ${totalStock === 0 ? 'disabled' : ''}>
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
    `;
}

/* ── Load products from product.json and render grid ── */
let allProducts = [];

fetch("product.json")
    .then(response => response.json())
    .then(data => {
        allProducts = data.products;
        
        /* Initialize price range max based on data */
        const maxPriceInDB = Math.max(...allProducts.map(p => p.price));
        const roundedMax = Math.ceil(maxPriceInDB / 100) * 100;
        
        const priceMaxInput = document.getElementById("price-max");
        if (priceMaxInput) {
            priceMaxInput.value = roundedMax;
        }

        /* Check for initial search query from URL parameter */
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        
        if (searchQuery) {
            const searchInput = document.getElementById("navbar-search-input");
            if (searchInput) {
                searchInput.value = searchQuery;
            }
            filterProducts(searchQuery);
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
        if (filterValue === "Winter" || filterValue === "Summer" || filterValue === "all") {
            activeSeason = filterValue;
        } else {
            // If it's a category from the top bar, sync with sidebar
            activeCategories.clear();
            activeCategories.add(filterValue);
            syncSidebarUI();
        }
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
        
        return matchesSeason && matchesCategory && matchesGender && matchesPrice;
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
    
    // Deactivate top bar category buttons since we are using sidebar multi-select
    document.querySelectorAll(".filter-btn").forEach(btn => {
        const val = btn.dataset.filter;
        if (val !== "all" && val !== "Winter" && val !== "Summer") {
            btn.classList.remove("active");
        }
    });

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
    renderGrid();
}

function handleSidebarSeasonClick(season, element) {
    activeSeason = season;
    
    // Sync top bar if it exists
    document.querySelectorAll(".filter-btn").forEach(btn => {
        if (btn.dataset.filter === season) {
            btn.classList.add("active");
        } else if (["all", "Winter", "Summer"].includes(btn.dataset.filter)) {
            btn.classList.remove("active");
        }
    });

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

    /* Update filter buttons active state (deactivate specific categories since search overrides) */
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (allBtn) {
        allBtn.classList.add("active");
    }

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
                // Category button in top bar
                document.querySelectorAll(".filter-btn").forEach(b => {
                    const val = b.dataset.filter;
                    if (val !== "Winter" && val !== "Summer" && val !== "all") {
                        b.classList.remove("active");
                    }
                });
                btn.classList.add("active");
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

    /* Add to Cart event delegation */
    const grid = document.getElementById("products-grid");
    if (grid) {
        grid.addEventListener("click", (e) => {
            const btn = e.target.closest(".add-to-cart-btn");
            if (!btn) return;
            
            const card = btn.closest(".product-card");
            if (!card) return;
            
            const productId = parseInt(card.dataset.id, 10);
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                if (product.stock > 0) {
                    openCartModal(product);
                } else {
                    showToast(`"${product.name}" is currently out of stock.`);
                }
            }
        });
    }

    /* Quantity button click-and-hold interaction */
    const minusBtn = document.querySelector(".qty-btn.minus");
    const plusBtn = document.querySelector(".qty-btn.plus");

    if (minusBtn) {
        minusBtn.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // Left click only
            startHoldAdjust(-1);
        });
        minusBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startHoldAdjust(-1);
        });
        minusBtn.addEventListener("mouseleave", stopHoldAdjust);
    }

    if (plusBtn) {
        plusBtn.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            startHoldAdjust(1);
        });
        plusBtn.addEventListener("touchstart", (e) => {
            e.preventDefault();
            startHoldAdjust(1);
        });
        plusBtn.addEventListener("mouseleave", stopHoldAdjust);
    }

    // Safety cancellations on window release
    window.addEventListener("mouseup", stopHoldAdjust);
    window.addEventListener("touchend", stopHoldAdjust);
    window.addEventListener("touchcancel", stopHoldAdjust);
});

/* ── Modal & Toast Controller Logic ── */
let activeProductForCart = null;

function openCartModal(product) {
    activeProductForCart = product;
    
    const modal = document.getElementById("cart-modal");
    const nameEl = document.getElementById("modal-product-name");
    const priceEl = document.getElementById("modal-product-price");
    const qtyInput = document.getElementById("quantity-input");
    const stockHint = document.getElementById("qty-stock-hint");
    const errorEl = document.getElementById("qty-error");
    
    if (!modal || !nameEl || !priceEl || !qtyInput || !stockHint) return;
    
    nameEl.textContent = product.name;
    priceEl.textContent = `$${product.price.toFixed(2)}`;
    
    const totalStock = product.sizes ? Object.values(product.sizes).reduce((sum, qty) => sum + qty, 0) : 0;
    
    qtyInput.value = 1;
    qtyInput.min = 1;
    qtyInput.max = totalStock;
    
    stockHint.textContent = `Available stock: ${totalStock}`;
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
    }
    
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
}

function closeCartModal() {
    const modal = document.getElementById("cart-modal");
    if (modal) {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    }
    activeProductForCart = null;
}

function adjustQuantity(amount) {
    const qtyInput = document.getElementById("quantity-input");
    const errorEl = document.getElementById("qty-error");
    if (!qtyInput || !activeProductForCart) return;
    
    let val = parseInt(qtyInput.value, 10) || 1;
    val += amount;
    
    const totalStock = activeProductForCart.sizes ? Object.values(activeProductForCart.sizes).reduce((sum, qty) => sum + qty, 0) : 0;
    
    if (val < 1) val = 1;
    if (val > totalStock) {
        val = totalStock;
    }
    
    qtyInput.value = val;
    
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.style.display = "none";
    }
}

function confirmAddToCart(event) {
    event.preventDefault();
    if (!activeProductForCart) return;
    
    const qtyInput = document.getElementById("quantity-input");
    const errorEl = document.getElementById("qty-error");
    if (!qtyInput) return;
    
    const qty = parseInt(qtyInput.value, 10);
    const totalStock = activeProductForCart.sizes ? Object.values(activeProductForCart.sizes).reduce((sum, qty) => sum + qty, 0) : 0;
    
    if (isNaN(qty) || qty < 1) {
        if (errorEl) {
            errorEl.textContent = "Please enter a valid quantity.";
            errorEl.style.display = "block";
        }
        return;
    }
    
    if (qty > totalStock) {
        if (errorEl) {
            errorEl.textContent = `Only ${totalStock} items available in stock.`;
            errorEl.style.display = "block";
        }
        return;
    }
    
    // Decrement inventory (for now, we'll subtract from available sizes sequentially)
    let remainingToSubtract = qty;
    for (const size in activeProductForCart.sizes) {
        if (activeProductForCart.sizes[size] >= remainingToSubtract) {
            activeProductForCart.sizes[size] -= remainingToSubtract;
            remainingToSubtract = 0;
            break;
        } else {
            remainingToSubtract -= activeProductForCart.sizes[size];
            activeProductForCart.sizes[size] = 0;
        }
    }
    
    // Refresh products view to reflect the updated stock
    const activeBtn = document.querySelector(".filter-btn.active");
    const currentFilter = activeBtn ? activeBtn.dataset.filter : "all";
    renderGrid(currentFilter);
    
    showToast(`Added ${qty} × "${activeProductForCart.name}" to your cart.`);
    closeCartModal();
}

function showToast(message) {
    let container = document.querySelector(".toast-container");
    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    container.appendChild(toast);
    
    // Force browser reflow to trigger CSS transitions
    toast.offsetHeight;
    
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
        toast.addEventListener("transitionend", () => {
            toast.remove();
        });
    }, 3000);
}

/* ── Hold-to-adjust continuous controls ── */
let holdTimeout = null;
let holdInterval = null;

function startHoldAdjust(amount) {
    // Immediate click action
    adjustQuantity(amount);
    
    // Delayed hold continuous looping
    holdTimeout = setTimeout(() => {
        holdInterval = setInterval(() => {
            adjustQuantity(amount);
        }, 80);
    }, 400);
}

function stopHoldAdjust() {
    if (holdTimeout) clearTimeout(holdTimeout);
    if (holdInterval) clearInterval(holdInterval);
    holdTimeout = null;
    holdInterval = null;
}
