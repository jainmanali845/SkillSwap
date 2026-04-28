/**
 * main.js — SkillSwap Shared Utilities
 * Toast notifications, dark-mode toggle, nav helpers, page guards.
 */

/* ══════════════════════════════
     DARK MODE
══════════════════════════════ */

const ThemeManager = (() => {
  const KEY = 'ss_theme';

  function init() {
    const saved = localStorage.getItem(KEY) || 'light';
    apply(saved);

    // Wire all toggle buttons on the page
    document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
      btn.addEventListener('click', toggle);
      syncIcon(btn);
    });
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(KEY, theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(syncIcon);
  }

  function toggle() {
    const current = localStorage.getItem(KEY) || 'light';
    apply(current === 'light' ? 'dark' : 'light');
  }

  function syncIcon(btn) {
    const current = localStorage.getItem(KEY) || 'light';
    btn.innerHTML = current === 'dark'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.setAttribute('title', current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }

  return { init, toggle, apply };
})();


/* ══════════════════════════════
     TOAST NOTIFICATIONS
══════════════════════════════ */

const Toast = (() => {
  let container;

  function ensureContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
  }

  function show(message, type = 'info', duration = 3500) {
    ensureContainer();

    const icons = {
      success: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
      error:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      info:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      warning: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span class="toast__msg">${message}</span>`;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('toast--visible'));

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, duration);
  }

  return { show };
})();


/* ══════════════════════════════
     NAV / AUTH GUARD
══════════════════════════════ */

/**
 * Call on protected pages to redirect unauthenticated users.
 */
function requireAuth() {
  const user = Storage.getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/**
 * Redirect logged-in users away from auth pages.
 */
function redirectIfLoggedIn(dest = 'dashboard.html') {
  if (Storage.getCurrentUser()) {
    window.location.href = dest;
  }
}

/**
 * Render user avatar + name in nav, add logout handler.
 */
function initNav(user) {
  const nameEl   = document.querySelector('[data-nav-name]');
  const avatarEl = document.querySelector('[data-nav-avatar]');
  const logoutEl = document.querySelector('[data-logout]');

  if (nameEl)   nameEl.textContent = user.name.split(' ')[0];
  if (avatarEl) { avatarEl.src = user.avatar; avatarEl.alt = user.name; }

  if (logoutEl) {
    logoutEl.addEventListener('click', e => {
      e.preventDefault();
      Storage.clearSession();
      window.location.href = 'index.html';
    });
  }
}

/**
 * Highlight current page link in sidebar / navbar.
 */
function highlightActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-link]').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === page || href.includes(page)) {
      a.classList.add('active');
    }
  });
}

/**
 * Format a timestamp to a readable string.
 */
function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Escape HTML to prevent XSS.
 */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Auto-init theme on every page ─── */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  highlightActiveNav();
});
