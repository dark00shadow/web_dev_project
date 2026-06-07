/* product-details.js */

let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    fetch("../json/product.json")
        .then(response => response.json())
        .then(data => {
            allProducts = data.products;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                renderProductDetails(product);
                renderRelatedSections(product);
                // Force the browser to stay at the top after dynamic content injection
                window.scrollTo(0, 0);
            } else {
                document.getElementById('details-view').innerHTML = '<p class="empty-state">Product not found.</p>';
            }
        })
        .catch(err => {
            console.error("Error loading product details:", err);
            document.getElementById('details-view').innerHTML = '<p class="empty-state">Error loading details.</p>';
        });
});

function getCurrentSeason() {
    const theme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('preferred-theme');
    if (theme) {
        return theme.charAt(0).toUpperCase() + theme.slice(1);
    }
    const month = new Date().getMonth();
    return (month >= 3 && month <= 8) ? "Summer" : "Winter";
}

function seasonIcon(season) {
    return season === "Winter" ? "❄️" : "☀️";
}


function renderProductDetails(product) {
    const container = document.getElementById('details-view');
    if (!container) return;

    // Extract available sizes as buttons
    const availableSizes = product.sizes ? Object.entries(product.sizes).filter(([_, qty]) => qty > 0) : [];
    const sizeButtons = availableSizes.map(([size, qty], idx) => 
        `<button type="button" class="size-btn ${idx === 0 ? 'active' : ''}" data-size="${size}" data-stock="${qty}">${size}</button>`
    ).join('');

    // Default to the first available size's stock
    const initialStock = availableSizes.length > 0 ? availableSizes[0][1] : 0;

    container.innerHTML = `
        <div class="details-image-section">
            <img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='${seasonIcon(product.season)}'">
        </div>
        <div class="details-info-section">
            <h1 class="details-title">${product.name}</h1>
            
            <p class="details-description">${product.description}</p>
            
            <div class="details-price">$${product.price.toFixed(2)}</div>
            
            <div class="details-sizes">
                <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted-heavy); margin-bottom: 10px;">Available Sizes:</h3>
                <div class="size-grid" id="size-selector-grid">${sizeButtons}</div>
            </div>

            <div class="details-quantity">
                <h3 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted-heavy); margin-bottom: 10px;">Quantity:</h3>
                <div class="qty-counter-details">
                    <button type="button" class="qty-btn-details minus">−</button>
                    <input type="number" value="0" min="0" max="${initialStock}" class="qty-input-details" readonly>
                    <button type="button" class="qty-btn-details plus">+</button>
                </div>
                <span class="stock-hint" style="font-size: 12px; color: var(--text-muted); margin-top: 5px; display: block;">
                    Available: <span id="max-stock-display">${initialStock}</span>
                </span>
            </div>

            <div class="details-actions">
                <button type="button" class="nav-btn primary action-btn" id="buy-now-btn" disabled>Buy Now</button>
                <button class="nav-btn action-btn" id="add-to-cart-final" disabled>Add to Cart</button>
            </div>
        </div>
    `;

    setupEventListeners(product);
}

function renderRelatedSections(currentProduct) {
    const currentSeason = getCurrentSeason();

    // 1. Similar Products: Same category, different ID
    const similarProducts = allProducts.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id);
    
    // 2. Other Seasonal: Current season, different category
    const seasonalProducts = allProducts.filter(p => p.season === currentSeason && p.category !== currentProduct.category);

    if (similarProducts.length > 0) {
        initSliderSection("similar-section", "similar-wrapper", similarProducts);
    }

    if (seasonalProducts.length > 0) {
        initSliderSection("seasonal-section", "seasonal-wrapper", seasonalProducts);
    }
}

function initSliderSection(sectionId, wrapperId, products) {
    const section = document.getElementById(sectionId);
    const wrapper = document.getElementById(wrapperId);
    if (!section || !wrapper) return;

    section.style.display = "block";

    const productHTML = products.map(product => `
        <a href="product-details.html?id=${product.id}" class="slider-card">
            <div class="slider-card-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='${seasonIcon(product.season)}'">
            </div>
            <div class="slider-card-body">
                <span class="slider-card-category">${product.category}</span>
                <h4 class="slider-card-name">${product.name}</h4>
                <span class="slider-card-price">$${product.price.toFixed(2)}</span>
            </div>
        </a>
    `).join("");

    wrapper.innerHTML = `
        <button class="slider-arrow left">❮</button>
        <div class="product-slider">${productHTML}</div>
        <button class="slider-arrow right">❯</button>
    `;

    const slider = wrapper.querySelector(".product-slider");
    const prevBtn = wrapper.querySelector(".slider-arrow.left");
    const nextBtn = wrapper.querySelector(".slider-arrow.right");

    startSliderLogic(slider, prevBtn, nextBtn);
}

function startSliderLogic(slider, prevBtn, nextBtn) {
    const updateSliderUI = () => {
        const isAtStart = slider.scrollLeft <= 5;
        // Check if we reached the end (with a small tolerance)
        const isAtEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5;
        const wrapper = slider.closest(".slider-wrapper");

        if (!wrapper) return;

        // Toggle arrow visibility
        prevBtn.classList.toggle("hidden", isAtStart);
        nextBtn.classList.toggle("hidden", isAtEnd);

        // Toggle blur mask based on scroll position
        wrapper.classList.remove("mask-both", "mask-left", "mask-right");
        if (!isAtStart && !isAtEnd) {
            wrapper.classList.add("mask-both");
        } else if (isAtStart && !isAtEnd) {
            wrapper.classList.add("mask-right");
        } else if (!isAtStart && isAtEnd) {
            wrapper.classList.add("mask-left");
        }
    };

    prevBtn.addEventListener("click", () => {
        slider.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    nextBtn.addEventListener("click", () => {
        slider.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });

    // Attach scroll and resize listeners to update UI dynamically
    slider.addEventListener("scroll", updateSliderUI);
    window.addEventListener("resize", updateSliderUI);

    // Dragging Logic
    let isDragging = false;
    let startX, scrollLeftStart;

    const startDragging = (e) => {
        isDragging = true;
        slider.classList.add('grabbing');
        startX = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        scrollLeftStart = slider.scrollLeft;
    };

    const stopDragging = () => {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('grabbing');
    };

    const moveDragging = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = (e.pageX || e.touches[0].pageX) - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeftStart - walk;
    };

    slider.addEventListener('mousedown', startDragging);
    slider.addEventListener('touchstart', startDragging, { passive: false });
    window.addEventListener('mousemove', moveDragging);
    window.addEventListener('touchmove', moveDragging, { passive: false });
    window.addEventListener('mouseup', stopDragging);
    window.addEventListener('touchend', stopDragging);

    // Initial check
    setTimeout(updateSliderUI, 50); // Slight delay to ensure content is measured
}


function setupEventListeners(product) {
    const grid = document.getElementById('size-selector-grid');
    const qtyInput = document.querySelector('.qty-input-details');
    const addBtn = document.getElementById('add-to-cart-final');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const stockDisplay = document.getElementById('max-stock-display');

    const updateButtonState = () => {
        const disabled = parseInt(qtyInput.value) === 0;
        addBtn.disabled = disabled;
        buyNowBtn.disabled = disabled;
    };

    // Size Selection Logic
    if (grid) {
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.size-btn');
            if (!btn) return;

            grid.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const newMax = parseInt(btn.dataset.stock);
            stockDisplay.textContent = newMax;
            qtyInput.max = newMax;
            qtyInput.value = 0; // Reset quantity on size change
            updateButtonState();
        });
    }

    // Quantity Logic
    document.querySelector('.qty-btn-details.plus').addEventListener('click', () => {
        const max = parseInt(qtyInput.max);
        let val = parseInt(qtyInput.value);
        if (val < max) {
            qtyInput.value = val + 1;
            updateButtonState();
        }
    });

    document.querySelector('.qty-btn-details.minus').addEventListener('click', () => {
        let val = parseInt(qtyInput.value);
        if (val > 0) {
            qtyInput.value = val - 1;
            updateButtonState();
        }
    });

    addBtn.addEventListener('click', () => {
        const activeSizeBtn = document.querySelector('.size-btn.active');
        if (!activeSizeBtn) return;

        const activeSize = activeSizeBtn.dataset.size;
        const qtyToAdd = parseInt(qtyInput.value);

        if (product.sizes[activeSize] >= qtyToAdd) {
            product.sizes[activeSize] -= qtyToAdd;
            addToLocalCart(product.id, product.name, activeSize, qtyToAdd);
            showToast(`Added ${qtyToAdd} × ${product.name} (${activeSize}) to your cart.`);

            renderProductDetails(product);
        }
    });

    buyNowBtn.addEventListener('click', () => {
        const activeSizeBtn = document.querySelector('.size-btn.active');
        if (!activeSizeBtn || buyNowBtn.disabled) return;

        const activeSize = activeSizeBtn.dataset.size;
        const qty = parseInt(qtyInput.value);

        if (qty > 0 && product.sizes[activeSize] >= qty) {
            startBuyNowCheckout(product.id, activeSize, qty);
        }
    });
}