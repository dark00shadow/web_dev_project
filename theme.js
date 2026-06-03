(function() {
  /**
   * Instant Theme Guard
   * This script runs synchronously in the <head> to prevent the "theme snap" (FOUT).
   * It determines the theme and applies the 'data-theme' attribute before the body renders.
   */
  const saved = localStorage.getItem('preferred-theme');
  const month = new Date().getMonth();
  const seasonalTheme = (month >= 3 && month <= 8) ? 'summer' : 'winter';
  const theme = saved || seasonalTheme;
  
  if (theme === 'summer') {
    document.documentElement.setAttribute('data-theme', 'summer');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
})();
