/* common.js - Shared functions across pages */

/**
 * Initialize stock data from product.json to localStorage
 * This should be called once when the site loads
 */
async function initializeStockFromProductJson() {
  // Check if stock already exists in localStorage
  if (localStorage.getItem('equinox-stock')) {
    return; // Already initialized
  }

  try {
    const response = await fetch('json/product.json');
    const data = await response.json();
    const products = data.products;

    // Create stock object: { productId: { size: quantity } }
    const stockData = {};
    products.forEach(product => {
      if (product.sizes) {
        stockData[product.id] = { ...product.sizes };
      }
    });

    // Store in localStorage
    localStorage.setItem('equinox-stock', JSON.stringify(stockData));
    console.log('Stock initialized from product.json');
  } catch (err) {
    console.error('Failed to initialize stock:', err);
  }
}

/**
 * Get stock for a specific product and size from localStorage
 */
function getProductStock(productId, size) {
  try {
    const stockData = JSON.parse(localStorage.getItem('equinox-stock') || '{}');
    return stockData[productId]?.[size] || 0;
  } catch (err) {
    console.error('Failed to get stock:', err);
    return 0;
  }
}

/**
 * Decrease stock for a specific product and size in localStorage
 */
function decreaseProductStock(productId, size, quantity) {
  try {
    const stockData = JSON.parse(localStorage.getItem('equinox-stock') || '{}');
    if (stockData[productId] && stockData[productId][size] !== undefined) {
      stockData[productId][size] = Math.max(0, stockData[productId][size] - quantity);
      localStorage.setItem('equinox-stock', JSON.stringify(stockData));
      console.log(`Decreased stock for product ${productId}, size ${size} by ${quantity}`);
    }
  } catch (err) {
    console.error('Failed to decrease stock:', err);
  }
}

/**
 * Adjust image path based on current page location
 * Returns the correct image path for the current context
 */
function adjustImagePath(imagePath) {
  if (!imagePath) return imagePath;

  const pathname = window.location.pathname;
  const isHomepage = pathname.endsWith('index.html') || pathname === '/' || !pathname.includes('/content/');

  let finalImgSrc = imagePath;

  if (isHomepage && finalImgSrc.startsWith('../')) {
    finalImgSrc = finalImgSrc.replace('../', '');
  } else if (!isHomepage && !finalImgSrc.startsWith('../') && !finalImgSrc.startsWith('/')) {
    finalImgSrc = '../' + finalImgSrc;
  }

  return finalImgSrc;
}

/**
 * Opens a centered popup window
 * On mobile devices (<= 600px), it navigates in the same window instead.
 */
function openCenteredPopup(url, title, w, h) {
  if (window.innerWidth <= 600) {
    window.location.href = url;
    return;
  }
  const left = (screen.width / 2) - (w / 2);
  const top = (screen.height / 2) - (h / 2);

  // Create a modal overlay on the parent page to prevent interaction while the popup is open
  const overlay = document.createElement('div');
  overlay.id = 'modal-backdrop';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
    z-index: 2000; cursor: not-allowed;
  `;
  document.body.appendChild(overlay);

  const popup = window.open(url, title, `width=${w}, height=${h}, top=${top}, left=${left}, scrollbars=yes, resizable=yes`);

  // Re-focus the popup when the backdrop is clicked to prevent it from slipping behind the main window
  overlay.onmousedown = (e) => {
    e.preventDefault(); // Prevents the parent window from taking focus
    if (popup && !popup.closed) {
      popup.focus();
      try {
        // Target the main card or body inside the popup to trigger the shake
        const target = popup.document.querySelector('main') || popup.document.body;
        target.classList.remove('shake-animation');
        void target.offsetWidth; // Trigger reflow to restart animation
        target.classList.add('shake-animation');
      } catch (e) {
        // Catch potential cross-origin errors if the popup is navigating
      }
    }
  };

  // Remove overlay when popup is closed
  const checkPopup = setInterval(() => {
    if (!popup || popup.closed) {
      clearInterval(checkPopup);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
  }, 500);

  return popup;
}

/**
 * Toggles the sidebar visibility
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
}

/**
 * Theme Engine
 * Determines the current season based on the system date.
 * Summer: April (3) to September (8)
 * Winter: October (9) to March (2)
 */
function getSeasonalTheme() {
  const month = new Date().getMonth(); 
  if (month >= 3 && month <= 8) {
    return 'summer';
  }
  return 'winter';
}

/**
 * Applies the given theme to the document and saves it to localStorage.
 */
function setTheme(themeName) {
  const toggleBtn = document.getElementById('theme-toggle');
  
  if (themeName === 'summer') {
    document.documentElement.setAttribute('data-theme', 'summer');
    if (toggleBtn) toggleBtn.classList.remove('flipped');
  } else {
    document.documentElement.removeAttribute('data-theme');
    if (toggleBtn) toggleBtn.classList.add('flipped');
  }
  localStorage.setItem('preferred-theme', themeName);
}

/**
 * Initializes the theme on page load.
 */
function initTheme() {
  const savedTheme = localStorage.getItem('preferred-theme');
  const currentTheme = savedTheme || getSeasonalTheme();
  setTheme(currentTheme);

  // Listen for theme changes from other windows/popups to sync theme globally
  window.addEventListener('storage', (e) => {
    if (e.key === 'preferred-theme' && e.newValue) {
      const newTheme = e.newValue;
      if (typeof onThemeToggle === 'function') {
        onThemeToggle(newTheme);
      } else {
        setTheme(newTheme);
        if (typeof loadSeasonalProducts === 'function') loadSeasonalProducts();
      }
    }
  });

  // Set up the flipping toggle listener
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isSummer = document.documentElement.getAttribute('data-theme') === 'summer';
      const newTheme = isSummer ? 'winter' : 'summer';
      
      // Check for specialized toggle handler (e.g., in products.js)
      if (typeof onThemeToggle === 'function') {
        onThemeToggle(newTheme);
      } else {
        setTheme(newTheme);
        // If we are on the home page, refresh the seasonal slider
        if (typeof loadSeasonalProducts === 'function') {
          loadSeasonalProducts();
        }
      }
    });
  }
}

/**
 * Injects the global footer HTML into the body of the page, 
 * except for login and register pages.
 */
function initFooter() {
  const path = window.location.pathname;
  const isExcludedPage = path.includes('login.html') || path.includes('register.html') || path.includes('checkout.html');

  if (isExcludedPage) return;

  const footerHTML = `
<footer class="main-store-footer">
    <div class="footer-container">
        <div class="footer-col brand-col">
            <h3>Equinox Store</h3>
            <p>Balancing seasonal styles with sharp tailoring.</p>
        </div>
        <div class="footer-col contact-col">
            <h4>Contact Us</h4>
            <ul>
                <li><span class="footer-icon">📞</span> +213 (0) 555 00 11 22</li>
                <li><span class="footer-icon">✉️</span> support@equinox-store.com</li>
                <li><span class="footer-icon">📍</span> Tizi Ouzou, Algeria</li>
            </ul>
        </div>
        <div class="footer-col socials-col">
            <h4>Follow Our Socials</h4>
            <ul class="social-links">
                <li><a href="#" class="social-item"><span class="footer-icon">📘</span> Facebook: /Equinox-store</a></li>
                <li><a href="#" class="social-item"><span class="footer-icon">📸</span> Instagram: @equinox_store</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-bottom-bar">
        <div class="footer-bottom-container">
            <p>Copyright &copy; 2026 Equinox Company LLC. All rights reserved.</p>
        </div>
    </div>
</footer>`;

  const productsMain = document.querySelector('.products-main');
  if (productsMain) {
    productsMain.insertAdjacentHTML('beforeend', footerHTML);
  } else {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
}

const BUY_NOW_STORAGE_KEY = 'equinox-buy-now-cart';

/**
 * Returns the cart used for checkout (buy-now session takes priority over saved cart).
 */
function getCheckoutCart() {
  const buyNow = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
  if (buyNow) return JSON.parse(buyNow);
  return JSON.parse(localStorage.getItem('equinox-cart') || '[]');
}

/**
 * Clears checkout cart data after a successful order.
 */
function clearCheckoutCart() {
  const isBuyNow = sessionStorage.getItem(BUY_NOW_STORAGE_KEY);
  sessionStorage.removeItem(BUY_NOW_STORAGE_KEY);
  if (!isBuyNow) {
    localStorage.removeItem('equinox-cart');
  }
  // Update cart UI to reflect the cleared cart
  updateCartUI();
}

/**
 * Starts a direct buy-now checkout for a single product without adding to cart.
 */
function startBuyNowCheckout(productId, size, qty) {
  sessionStorage.setItem(BUY_NOW_STORAGE_KEY, JSON.stringify([{ id: productId, size, qty }]));
  const isInHtmlFolder = window.location.pathname.includes('/content/');
  const checkoutPath = isInHtmlFolder ? 'checkout.html' : 'content/checkout.html';
  openCenteredPopup(checkoutPath, 'checkout', 550, 900);
}

/**
 * Adds or merges an item in the local cart (localStorage).
 */
function addToLocalCart(productId, productName, size, qty) {
  const cart = JSON.parse(localStorage.getItem('equinox-cart') || '[]');
  const existing = cart.find(item => item.id === productId && item.size === size);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, size, qty });
  }

  localStorage.setItem('equinox-cart', JSON.stringify(cart));
  updateCartUI();
}

const ORDERS_STORAGE_KEY = 'equinox-orders';
const ORDER_MS_DAY = 24 * 60 * 60 * 1000;
const ORDER_DELIVERED_RETENTION_DAYS = 3;

const ORDER_STATUS_LABELS = {
  preparing: 'Preparing the command',
  'on-delivery': 'On delivery',
  delivered: 'Delivered'
};

/**
 * Gets the user-specific orders storage key based on the logged-in user's email.
 */
function getUserOrdersStorageKey() {
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.email) {
    return `${ORDERS_STORAGE_KEY}-${currentUser.email}`;
  }
  return ORDERS_STORAGE_KEY;
}

/**
 * Generates a unique Equinox order number.
 */
function generateOrderNumber() {
  const suffix = Math.floor(10000 + Math.random() * 90000);
  return `EQ-${suffix}`;
}

/**
 * Resolves the current shipping status for an order based on age.
 */
function getOrderStatus(order) {
  const ageDays = (Date.now() - order.placedAt) / ORDER_MS_DAY;
  if (ageDays < 1) return 'preparing';
  if (ageDays < 2) return 'on-delivery';
  return 'delivered';
}

/**
 * Ensures delivered orders have a delivery timestamp for retention logic.
 */
function ensureDeliveredTimestamp(order) {
  const status = getOrderStatus(order);
  if (status === 'delivered' && !order.deliveredAt) {
    order.deliveredAt = order.placedAt + 2 * ORDER_MS_DAY;
  }
  return status;
}

/**
 * Removes delivered orders older than three days.
 */
function purgeExpiredOrders(orders) {
  return orders.filter(order => {
    const status = ensureDeliveredTimestamp(order);
    if (status !== 'delivered') return true;

    const deliveredAt = order.deliveredAt || order.placedAt + 2 * ORDER_MS_DAY;
    const retentionMs = ORDER_DELIVERED_RETENTION_DAYS * ORDER_MS_DAY;
    return Date.now() - deliveredAt < retentionMs;
  });
}

/**
 * Returns all confirmed orders for the current user, with expired delivered receipts removed.
 */
function getConfirmedOrders() {
  const storageKey = getUserOrdersStorageKey();
  let orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
  orders.forEach(ensureDeliveredTimestamp);
  orders = purgeExpiredOrders(orders);
  localStorage.setItem(storageKey, JSON.stringify(orders));
  return orders.sort((a, b) => b.placedAt - a.placedAt);
}

/**
 * Saves a new confirmed order after checkout for the current user.
 */
function saveConfirmedOrder(orderData) {
  const storageKey = getUserOrdersStorageKey();
  const orders = JSON.parse(localStorage.getItem(storageKey) || '[]');
  const order = {
    id: generateOrderNumber(),
    placedAt: Date.now(),
    deliveredAt: null,
    ...orderData
  };
  orders.push(order);
  localStorage.setItem(storageKey, JSON.stringify(orders));
  return order;
}

/**
 * Updates the cart badge count in the navbar across all pages.
 */
function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem('equinox-cart') || '[]');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = totalItems;
  });
}

/* SVG Constants for Password Toggles */
const EYE_OPEN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const EYE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

/**
 * Initializes password visibility toggles.
 */
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    const input = toggle.parentNode.querySelector('input');
    
    // Set initial icon state based on input type
    toggle.innerHTML = input.type === 'password' ? EYE_OFF_SVG : EYE_OPEN_SVG;

    toggle.addEventListener('click', function() {
      if (input.type === 'password') {
        input.type = 'text';
        this.innerHTML = EYE_OPEN_SVG;
      } else {
        input.type = 'password';
        this.innerHTML = EYE_OFF_SVG;
      }
    });
  });
}

// Initialize global components on DOM content loaded
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initFooter();
  updateCartUI();
  initPasswordToggles();
  updateNavbarAuth();
});

/**
 * Navigates the parent (opener) window and closes the current popup.
 * Used for navigation links inside Login/Register popups.
 */
function navigateParent(url) {
  if (window.opener && !window.opener.closed) {
    window.opener.location.href = url;
    window.close();
  } else {
    // If the page was opened directly (not as a popup), just navigate normally
    window.location.href = url;
  }
}

/**
 * Smoothly resizes the window to the target dimensions over a specified duration.
 * This prevents the "jarring" snap of standard window.resizeTo().
 */
function smoothResizeTo(targetW, targetH, duration = 400) {
  const startW = window.outerWidth;
  const startH = window.outerHeight;
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out quad function for smooth deceleration
    const ease = 1 - (1 - progress) * (1 - progress);

    const currentW = Math.round(startW + (targetW - startW) * ease);
    const currentH = Math.round(startH + (targetH - startH) * ease);

    window.resizeTo(currentW, currentH);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

/**
 * Displays a temporary toast notification at the bottom right of the page.
 * Appends to <html> so fixed positioning is not broken by body transforms
 * (e.g. the product-details page entrance animation).
 * @param {string} message - The message to display
 * @param {boolean} isError - Optional: Whether this is an error toast
 * @param {string} type - Optional: The type of toast ('error', 'success', etc.)
 */
function showToast(message, isError = false, type = 'success') {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.documentElement.appendChild(container);
  }
  
  const toast = document.createElement("div");
  toast.className = "toast";
  
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  
  // Set icon based on type
  if (type === 'error' || isError) {
    icon.innerHTML = "&#10007;"; // X mark for error
    toast.classList.add("toast-error");
  } else {
    icon.innerHTML = "&#10003;"; // Checkmark for success
    toast.classList.add("toast-success");
  }
  
  const content = document.createElement("span");
  content.textContent = message;

  toast.appendChild(icon);
  toast.appendChild(content);

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

/**
 * Displays a checkout confirmation popup at the top center.
 */
function showCheckoutPopup(message, onConfirm) {
  let container = document.querySelector(".toast-container.top-center");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container top-center";
    document.documentElement.appendChild(container);
  }

  const popup = document.createElement("div");
  popup.className = "checkout-popup";
  
  const closePopup = () => {
    popup.classList.remove("show");
    document.removeEventListener('click', handleOutsideClick);
    setTimeout(() => popup.remove(), 300);
  };

  const text = document.createElement("span");
  text.textContent = message;
  popup.appendChild(text);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "checkout-button-group";

  const cancelBtn = document.createElement("button");
  cancelBtn.className = "checkout-cancel-btn";
  cancelBtn.textContent = "Cancel";
  cancelBtn.onclick = closePopup;
  buttonGroup.appendChild(cancelBtn);

  const confirmBtn = document.createElement("button");
  confirmBtn.className = "checkout-confirm-btn";
  confirmBtn.textContent = "Confirm Checkout";
  confirmBtn.onclick = () => {
    onConfirm();
    closePopup();
  };
  buttonGroup.appendChild(confirmBtn);

  popup.appendChild(buttonGroup);

  container.appendChild(popup);
  popup.offsetHeight; // trigger reflow
  popup.classList.add("show");
}

/**
 * Returns the currently logged-in user from localStorage.
 */
function getCurrentUser() {
  const userStr = localStorage.getItem('equinox-current-user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Logs out the current user by removing from localStorage and updating UI.
 */
function logout() {
  localStorage.removeItem('equinox-current-user');
  updateNavbarAuth();
  showToast('Logged out successfully');
}

/**
 * Updates the navbar to show either login/register buttons or user profile.
 */
function updateNavbarAuth() {
  const currentUser = getCurrentUser();
  const navbarRight = document.querySelector('.navbar-right');
  
  if (!navbarRight) return;

  // Remove existing auth buttons or user profile
  const existingAuthBtns = navbarRight.querySelectorAll('.auth-buttons, .user-profile');
  existingAuthBtns.forEach(el => el.remove());

  // Determine correct paths for login/register based on current location
  const isInHtmlFolder = window.location.pathname.includes('/content/');
  const loginPath = isInHtmlFolder ? 'login.html' : 'content/login.html';
  const registerPath = isInHtmlFolder ? 'register.html' : 'content/register.html';

  if (currentUser) {
    // Determine correct path for orders based on current location
    const ordersPath = isInHtmlFolder ? 'orders.html' : 'content/orders.html';

    // Create user profile element with dropdown
    const userProfile = document.createElement('div');
    userProfile.className = 'user-profile';
    userProfile.innerHTML = `
      <div class="profile-dropdown">
        <button class="profile-toggle" onclick="toggleProfileDropdown(event)">
          <svg class="profile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="user-greeting">Hello, ${currentUser.name}</span>
        </button>
        <div class="dropdown-menu" id="profile-dropdown-menu">
          <a href="${ordersPath}" class="dropdown-item">Receipts</a>
          <button class="dropdown-item logout-item" onclick="logout()">Logout</button>
        </div>
      </div>
    `;
    navbarRight.appendChild(userProfile);
  } else {
    // Create login/register buttons
    const authButtons = document.createElement('div');
    authButtons.className = 'auth-buttons';
    authButtons.innerHTML = `
      <a href="#" class="nav-btn" onclick="openCenteredPopup('${loginPath}', 'login', 520, 800)">Login</a>
      <a href="#" class="nav-btn primary" onclick="openCenteredPopup('${registerPath}', 'register', 550, 950)">Register</a>
    `;
    navbarRight.appendChild(authButtons);
  }

  // Also update sidebar auth buttons if they exist
  const sidebarAuthButtons = document.querySelector('.sidebar-auth-buttons');
  if (sidebarAuthButtons) {
    if (currentUser) {
      sidebarAuthButtons.innerHTML = `
        <div class="sidebar-user-profile">
          <svg class="profile-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="user-greeting">Hello, ${currentUser.name}</span>
        </div>
      `;
    } else {
      sidebarAuthButtons.innerHTML = `
        <a href="#" class="sidebar-auth-btn login-btn" onclick="openCenteredPopup('${loginPath}', 'login', 520, 800)">Login</a>
        <a href="#" class="sidebar-auth-btn register-btn" onclick="openCenteredPopup('${registerPath}', 'register', 550, 950)">Register</a>
      `;
    }
  }
}

/**
 * Toggle the profile dropdown menu
 */
function toggleProfileDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
  const dropdown = document.getElementById('profile-dropdown-menu');
  const profileToggle = document.querySelector('.profile-toggle');
  if (dropdown && !dropdown.contains(event.target) && !profileToggle.contains(event.target)) {
    dropdown.classList.remove('show');
  }
});
