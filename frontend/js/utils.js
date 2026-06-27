/* ============================================================
   utils.js — Shared Utilities
   ============================================================ */

// ── Toast Notifications ───────────────────────────────────────
function ensureToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };

  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── SweetAlert2-like Confirm ──────────────────────────────────
export function showConfirm(title, message, confirmText = 'Delete', type = 'danger') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:400px;text-align:center;padding:32px 28px">
        <div style="font-size:48px;margin-bottom:16px">${type === 'danger' ? '⚠️' : '❓'}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:8px;color:var(--text-primary)">${title}</h3>
        <p style="color:var(--text-secondary);font-size:14px;margin-bottom:24px">${message}</p>
        <div style="display:flex;gap:10px;justify-content:center">
          <button id="confirm-cancel" class="btn-ghost">Cancel</button>
          <button id="confirm-ok" class="btn-danger" style="padding:10px 22px;border-radius:8px;font-size:14px;font-weight:600">${confirmText}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

// ── Currency Formatting ───────────────────────────────────────
export function formatCurrency(amount, currency = 'USD') {
  const user = getUser();
  const curr = user?.currency || currency;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: curr,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

// ── Date Formatting ───────────────────────────────────────────
export function formatDate(date, format = 'medium') {
  if (!date) return '-';
  const d = new Date(date);
  const opts = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
    input: { year: 'numeric', month: '2-digit', day: '2-digit' },
  };
  if (format === 'input') {
    // Return yyyy-mm-dd for <input type="date">
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleDateString('en-US', opts[format] || opts.medium);
}

export function formatTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

// ── Auth Helpers ──────────────────────────────────────────────
export function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken');
}

export function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  return true;
}

export function redirectIfLoggedIn() {
  if (isLoggedIn()) {
    window.location.href = '/pages/dashboard.html';
  }
}

// ── Theme ─────────────────────────────────────────────────────
export function getTheme() {
  return 'light';
}

export function setTheme(theme) {
  localStorage.setItem('theme', 'light');
  document.documentElement.setAttribute('data-theme', 'light');
  const icon = document.getElementById('theme-toggle-icon');
  if (icon) icon.className = 'fas fa-moon';
}

export function initTheme() {
  setTheme('light');
}

// ── Debounce ──────────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// ── String Helpers ────────────────────────────────────────────
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str, len = 40) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// ── Pagination Helper ─────────────────────────────────────────
export function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (totalPages <= 1) return;

  const createBtn = (label, page, active = false, disabled = false) => {
    const btn = document.createElement('button');
    btn.className = `page-btn${active ? ' active' : ''}`;
    btn.innerHTML = label;
    btn.disabled = disabled;
    if (!disabled) btn.onclick = () => onPageChange(page);
    return btn;
  };

  container.appendChild(createBtn('<i class="fas fa-chevron-left"></i>', currentPage - 1, false, currentPage === 1));

  const range = getPaginationRange(currentPage, totalPages);
  range.forEach((page) => {
    if (page === '...') {
      const dots = document.createElement('span');
      dots.className = 'page-btn';
      dots.textContent = '...';
      dots.style.cursor = 'default';
      container.appendChild(dots);
    } else {
      container.appendChild(createBtn(page, page, page === currentPage));
    }
  });

  container.appendChild(createBtn('<i class="fas fa-chevron-right"></i>', currentPage + 1, false, currentPage === totalPages));
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

// ── Load sidebar/navbar components ───────────────────────────
export async function loadComponents() {
  const sidebar = document.getElementById('sidebar-placeholder');
  const navbar = document.getElementById('navbar-placeholder');

  if (sidebar) {
    const res = await fetch('/components/sidebar.html');
    sidebar.innerHTML = await res.text();
    initSidebar();
  }
  if (navbar) {
    const res = await fetch('/components/navbar.html');
    navbar.innerHTML = await res.text();
    initNavbar();
  }
}

function initSidebar() {
  // Mark active nav item
  const current = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach((item) => {
    if (item.getAttribute('href') && current.includes(item.getAttribute('href').split('/').pop())) {
      item.classList.add('active');
    }
  });

  // Mobile sidebar toggle
  const toggle = document.getElementById('sidebar-toggle-btn');
  const sidebarEl = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle && sidebarEl && overlay) {
    toggle.onclick = () => {
      sidebarEl.classList.toggle('open');
      overlay.classList.toggle('visible');
    };
    overlay.onclick = () => {
      sidebarEl.classList.remove('open');
      overlay.classList.remove('visible');
    };
  }

  // Populate user info
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    const placeholderEl = document.getElementById('sidebar-avatar-placeholder');

    if (nameEl) nameEl.textContent = user.fullName || 'User';
    if (user.profilePicture && avatarEl) {
      avatarEl.src = user.profilePicture;
      avatarEl.style.display = 'block';
      if (placeholderEl) placeholderEl.style.display = 'none';
    } else if (placeholderEl) {
      placeholderEl.textContent = getInitials(user.fullName);
    }
  }
}

function initNavbar() {
  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.onclick = () => {
      const current = getTheme();
      setTheme(current === 'dark' ? 'light' : 'dark');
    };
  }

  // Load and setup notifications dropdown
  const bell = document.getElementById('notification-bell-btn');
  const dropdown = document.getElementById('notification-dropdown');
  const badge = document.getElementById('notification-badge');
  const list = document.getElementById('notifications-dropdown-list');
  const markAllBtn = document.getElementById('mark-all-read-btn');

  if (bell && dropdown && badge && list) {
    bell.onclick = (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) fetchNotifications();
    };

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    const token = localStorage.getItem('accessToken');

    const fetchNotifications = async () => {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5000/api/v1/notifications/unread', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
          const items = json.data;
          
          if (items.length > 0) {
            badge.textContent = items.length;
            badge.style.display = 'block';
          } else {
            badge.style.display = 'none';
          }

          if (items.length === 0) {
            list.innerHTML = `<div style="text-align:center;padding:12px;font-size:12px;color:var(--color-text-muted);">No new notifications</div>`;
          } else {
            list.innerHTML = items.map(n => `
              <div class="notification-item" style="padding:10px;border-radius:8px;background:var(--color-bg-page);font-size:12px;position:relative;">
                <div style="font-weight:700;color:var(--color-text-primary);margin-bottom:2px">${n.title}</div>
                <div style="color:var(--color-text-secondary);line-height:1.4">${n.message}</div>
                <button class="mark-read-item-btn" data-id="${n._id}" style="position:absolute;top:10px;right:10px;background:none;border:none;color:var(--color-text-muted);cursor:pointer;" title="Mark read"><i class="fas fa-check"></i></button>
              </div>
            `).join('');

            list.querySelectorAll('.mark-read-item-btn').forEach(btn => {
              btn.onclick = async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                try {
                  await fetch(`http://localhost:5000/api/v1/notifications/${id}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  fetchNotifications();
                } catch {}
              };
            });
          }
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };

    if (markAllBtn) {
      markAllBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!token) return;
        try {
          await fetch('http://localhost:5000/api/v1/notifications/read-all', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          fetchNotifications();
        } catch {}
      };
    }

    fetchNotifications();
  }
}

// ── Format number ─────────────────────────────────────────────
export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n?.toFixed(2) || '0.00';
}

export const CHART_COLORS = [
  '#1A4731', '#2D6A4F', '#40916C', '#52B788', '#74C69D',
  '#95D5B2', '#B7E4C7', '#688F78', '#8EA99A', '#A3B899'
];
