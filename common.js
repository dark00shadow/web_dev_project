/* common.js - Shared functions across pages */

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
  return window.open(url, title, `width=${w}, height=${h}, top=${top}, left=${left}, 
    scrollbars=yes, resizable=yes`);
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

// Initialize theme on DOM content loaded
window.addEventListener('DOMContentLoaded', initTheme);

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
