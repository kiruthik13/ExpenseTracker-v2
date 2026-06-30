/* ============================================================
   profile.js — Profile & Settings Page Logic
   ============================================================ */
import { userAPI, authAPI, paymentAPI, achievementAPI } from './api.js';
import { showToast, showConfirm, requireAuth, getUser, loadComponents, initTheme, getInitials } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await Promise.all([loadProfile(), loadAchievements()]);
  bindEvents();
});

// ── Load Profile ──────────────────────────────────────────────
async function loadProfile() {
  try {
    const res = await userAPI.getProfile();
    const user = res.data;

    // Update localStorage
    localStorage.setItem('user', JSON.stringify(user));

    // Populate fields
    const fields = ['fullName', 'email', 'currency', 'timezone', 'monthlyIncome'];
    fields.forEach(field => {
      const el = document.getElementById(`profile-${field}`);
      if (el) el.value = user[field] || '';
    });

    // Profile picture
    const pic = document.getElementById('profile-avatar');
    const placeholder = document.getElementById('profile-avatar-placeholder');
    if (user.profilePicture && pic) {
      pic.src = user.profilePicture;
      pic.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    } else if (placeholder) {
      placeholder.textContent = getInitials(user.fullName);
      placeholder.style.display = 'flex';
    }

    // Preferences/Settings
    if (user.preferences) {
      const themeToggle = document.getElementById('pref-dark-mode');
      const notifToggle = document.getElementById('pref-notifications');
      const alertToggle = document.getElementById('pref-budget-alerts');
      if (themeToggle) themeToggle.checked = user.preferences.theme === 'dark';
      if (notifToggle) notifToggle.checked = user.preferences.notifications;
      if (alertToggle) alertToggle.checked = user.preferences.budgetAlerts;
    }
  } catch (err) {
    showToast('Failed to load profile', 'error');
  }
}

// ── Save Profile ──────────────────────────────────────────────
async function saveProfile() {
  const btn = document.getElementById('save-profile-btn');
  if (btn) btn.disabled = true;

  const data = {
    fullName: document.getElementById('profile-fullName')?.value?.trim(),
    currency: document.getElementById('profile-currency')?.value,
    timezone: document.getElementById('profile-timezone')?.value,
    monthlyIncome: parseFloat(document.getElementById('profile-monthlyIncome')?.value || 0),
  };

  try {
    const res = await userAPI.updateProfile(data);
    localStorage.setItem('user', JSON.stringify(res.data));
    showToast('Profile updated ✓', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to update profile', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Change Password ───────────────────────────────────────────
async function changePassword() {
  const btn = document.getElementById('change-pw-btn');
  if (btn) btn.disabled = true;

  const currentPassword = document.getElementById('current-password')?.value;
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-new-password')?.value;

  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    if (btn) btn.disabled = false;
    return;
  }

  try {
    await authAPI.changePassword({ currentPassword, newPassword });
    showToast('Password changed successfully ✓', 'success');
    document.getElementById('password-form')?.reset();
  } catch (err) {
    showToast(err.message || 'Failed to change password', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ── Profile Picture ───────────────────────────────────────────
async function uploadProfilePicture(file) {
  if (!file) return;
  try {
    const res = await userAPI.uploadPicture(file);
    const pic = document.getElementById('profile-avatar');
    const placeholder = document.getElementById('profile-avatar-placeholder');
    if (pic) { pic.src = res.data.profilePicture; pic.style.display = 'block'; }
    if (placeholder) placeholder.style.display = 'none';
    localStorage.setItem('user', JSON.stringify(res.data));
    showToast('Profile picture updated ✓', 'success');
  } catch {
    showToast('Failed to upload picture', 'error');
  }
}

// ── Save Preferences ──────────────────────────────────────────
async function savePreferences() {
  const preferences = {
    theme: document.getElementById('pref-dark-mode')?.checked ? 'dark' : 'light',
    notifications: document.getElementById('pref-notifications')?.checked ?? true,
    budgetAlerts: document.getElementById('pref-budget-alerts')?.checked ?? true,
  };

  try {
    await userAPI.updateProfile({ preferences });
    // Apply theme immediately
    const { initTheme: _initTheme, setTheme } = await import('./utils.js');
    setTheme(preferences.theme);
    showToast('Settings saved ✓', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to save settings', 'error');
  }
}

// ── Bind Events ───────────────────────────────────────────────
function bindEvents() {
  document.getElementById('save-profile-btn')?.addEventListener('click', saveProfile);
  document.getElementById('change-pw-btn')?.addEventListener('click', changePassword);
  document.getElementById('save-settings-btn')?.addEventListener('click', savePreferences);

  // Avatar click to upload
  const avatarWrap = document.getElementById('avatar-upload-wrap');
  const avatarInput = document.getElementById('avatar-file-input');
  if (avatarWrap && avatarInput) {
    avatarWrap.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
          const pic = document.getElementById('profile-avatar');
          const placeholder = document.getElementById('profile-avatar-placeholder');
          if (pic) { pic.src = ev.target.result; pic.style.display = 'block'; }
          if (placeholder) placeholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
        uploadProfilePicture(file);
      }
    });
  }

  // Password visibility toggles
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-group-custom')?.querySelector('input');
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      }
    });
  });

  // Logout button
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    window.location.href = '/pages/login.html';
  });
}

async function loadAchievements() {
  const container = document.getElementById('badges-grid');
  if (!container) return;

  container.innerHTML = Array(3).fill('<div class="skeleton" style="height:80px;border-radius:12px"></div>').join('');

  try {
    const res = await achievementAPI.getAll();
    const unlockedList = res.data;

    const ALL_BADGES = [
      { key: 'first_expense', icon: 'fa-shoe-prints', title: 'First Step', desc: 'Log your first expense.' },
      { key: 'thirty_day_streak', icon: 'fa-fire', title: 'Loyal Logger', desc: 'Maintain a 30-day streak.' },
      { key: 'saved_10000', icon: 'fa-piggy-bank', title: 'Wealth Builder', desc: 'Accumulate ₹1,00,000 in goals.' },
      { key: 'budget_master', icon: 'fa-crown', title: 'Disciplined Spender', desc: 'Keep budgets under limits.' },
      { key: 'smart_saver', icon: 'fa-check-circle', title: 'Goal Getter', desc: 'Complete your first goal.' },
      { key: 'expense_champion', icon: 'fa-award', title: 'Expense Champion', desc: 'Log 100 transactions.' }
    ];

    container.innerHTML = ALL_BADGES.map(badge => {
      const unlocked = unlockedList.find(u => u.badgeKey === badge.key);
      const opacity = unlocked ? '1' : '0.35';
      const grayscaled = unlocked ? '' : 'filter: grayscale(1);';
      const timeStr = unlocked ? `<div style="font-size:10px;color:var(--color-income);font-weight:600;margin-top:4px;">Unlocked ${new Date(unlocked.unlockedAt).toLocaleDateString()}</div>` : `<div style="font-size:10px;color:var(--color-text-muted);margin-top:4px;">Locked</div>`;

      return `
        <div style="padding:16px;background:#fff;border:1px solid var(--color-border);border-radius:14px;display:flex;flex-direction:column;align-items:center;text-align:center;opacity:${opacity};${grayscaled}">
          <div style="width:48px;height:48px;border-radius:50%;background:var(--color-accent-bg);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:12px;">
            <i class="fas ${badge.icon}"></i>
          </div>
          <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${badge.title}</div>
          <div style="font-size:11px;color:var(--color-text-secondary);margin-top:4px;line-height:1.4">${badge.desc}</div>
          ${timeStr}
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);">Failed to load achievements</div>`;
  }
}
