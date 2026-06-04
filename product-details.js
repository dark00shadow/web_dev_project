/* product-details.js */

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'products.html';
        return;
    }

    fetch("product.json")
        .then(response => response.json())
        .then(data => {
            const product = data.products.find(p => p.id === productId);
            if (product) {
                renderProductDetails(product);
            } else {
                document.getElementById('details-view').innerHTML = '<p class="empty-state">Product not found.</p>';
            }
        })
        .catch(err => {
            console.error("Error loading product details:", err);
            document.getElementById('details-view').innerHTML = '<p class="empty-state">Error loading details.</p>';
        });
});

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
                <button class="nav-btn primary action-btn" id="add-to-cart-final" disabled>Add to Cart</button>
                <button class="nav-btn action-btn" onclick="window.history.back()">Go Back</button>
            </div>
        </div>
    `;

    setupEventListeners(product);
}

function setupEventListeners(product) {
    const grid = document.getElementById('size-selector-grid');
    const qtyInput = document.querySelector('.qty-input-details');
    const addBtn = document.getElementById('add-to-cart-final');
    const stockDisplay = document.getElementById('max-stock-display');

    const updateButtonState = () => {
        addBtn.disabled = parseInt(qtyInput.value) === 0;
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
        const activeSize = document.querySelector('.size-btn.active').dataset.size;
        alert(`Added ${qtyInput.value} of size ${activeSize} to cart!`);
    });
}