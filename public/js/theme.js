// public/js/theme.js
// Toggle handler. The synchronous init in layout.ejs sets the initial state;
// this script just wires the toggle button + persists user preference.
(function () {
  const STORAGE_KEY = 'fm-theme';

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
    syncIcons(theme);
  }

  function syncIcons(theme) {
    document.querySelectorAll('#theme-toggle .theme-icon-light').forEach((el) => {
      el.style.display = theme === 'dark' ? 'none' : 'inline';
    });
    document.querySelectorAll('#theme-toggle .theme-icon-dark').forEach((el) => {
      el.style.display = theme === 'dark' ? 'inline' : 'none';
    });
  }

  const btn = document.getElementById('theme-toggle');
  if (btn) {
    syncIcons(currentTheme());
    btn.addEventListener('click', () => {
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // Re-sync if the OS preference changes and the user hasn't picked one.
  if (window.matchMedia && !localStorage.getItem(STORAGE_KEY)) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      applyTheme(e.matches ? 'dark' : 'light');
    });
  }
})();
