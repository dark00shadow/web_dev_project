/* common.js - Shared functions across pages */

/**
 * Opens a centered popup window
 */
function openCenteredPopup(url, title, w, h) {
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
  if (themeName === 'summer') {
    document.documentElement.setAttribute('data-theme', 'summer');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('preferred-theme', themeName);
}

/**
 * Initializes the theme on page load.
 */
function initTheme() {
  const savedTheme = localStorage.getItem('preferred-theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme(getSeasonalTheme());
  }
}

// Auto-initialize theme as soon as the DOM is ready
document.addEventListener('DOMContentLoaded', initTheme);

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

