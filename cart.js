/* cart.js */

let allProducts = [];
let cart = [];

document.addEventListener("DOMContentLoaded", () => {
    fetch("product.json")
        .then(response => response.json())
        .then(data => {
            allProducts = data.products;
            loadAndRenderCart();
        })
        .catch(err => console.error("Error loading products for cart:", err));
});

function loadAndRenderCart() {
    cart = JSON.parse(localStorage.getItem('equinox-cart') || '[]');
    renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-main-container');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-header"><h1>Your Cart</h1></div>
            <p class="empty-state">Your cart is empty. <a href="products.html" style="color: var(--accent-winter);">Go shopping!</a></p>
        `;
        return;
    }

    let subtotal = 0;
    const itemsHTML = cart.map(item => {
        const product = allProducts.find(p => p.id === item.id);
        if (!product) return '';

        const itemTotal = product.price * item.qty;
        subtotal += itemTotal;

        return `
            <div class="cart-item" data-id="${item.id}" data-size="${item.size}">
                <img src="${product.image}" alt="${product.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <h3 class="cart-item-name">${product.name}</h3>
                    <p class="cart-item-details">Size: ${item.size} | Price: $${product.price.toFixed(2)}</p>
                    <div class="qty-counter-details" style="margin-top: 10px; display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 8px; width: fit-content;">
                        <button type="button" class="qty-btn-details minus" style="padding: 5px 10px; border: none; background: none; color: white; cursor: pointer;" onclick="updateQty('${item.id}', '${item.size}', -1)">−</button>
                        <span class="qty-value" style="padding: 0 15px; font-weight: 600;">${item.qty}</span>
                        <button type="button" class="qty-btn-details plus" style="padding: 5px 10px; border: none; background: none; color: white; cursor: pointer;" onclick="updateQty('${item.id}', '${item.size}', 1)">+</button>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div class="cart-item-price">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-item-btn" onclick="removeCartItem('${item.id}', '${item.size}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="cart-header">
            <h1>Your Cart</h1>
            <p>${cart.length} ${cart.length === 1 ? 'product' : 'products'} in your cart</p>
        </div>
        <div class="cart-grid">
            <div class="cart-items-list">${itemsHTML}</div>
            <div class="cart-summary">
                <h3>Order Summary</h3>
                <div class="summary-row" style="margin-top: 20px;">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping</span>
                    <span style="color: var(--accent-winter);">FREE</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <button class="nav-btn primary" style="width: 100%; margin-top: 20px; padding: 15px; cursor: pointer; display: block;" onclick="startCheckout()">
                    Proceed to Checkout
                </button>
            </div>
        </div>
    `;
}

window.updateQty = function(id, size, delta) {
    const item = cart.find(i => i.id === id && i.size === size);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
        removeCartItem(id, size);
    } else {
        item.qty = newQty;
        localStorage.setItem('equinox-cart', JSON.stringify(cart));
        renderCart();
        if (typeof updateCartUI === 'function') updateCartUI();
    }
};

window.removeCartItem = function(id, size) {
    cart = cart.filter(item => !(item.id === id && item.size === size));
    localStorage.setItem('equinox-cart', JSON.stringify(cart));
    renderCart();
    if (typeof updateCartUI === 'function') updateCartUI();
};

window.startCheckout = function() {
    openCenteredPopup('checkout.html', 'checkout', 550, 850);
};