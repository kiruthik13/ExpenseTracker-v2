/* ============================================================
   auth.js — Authentication Logic
   ============================================================ */
import { authAPI } from './api.js';
import { showToast, redirectIfLoggedIn, initTheme } from './utils.js';

initTheme();

// ── Login Page ────────────────────────────────────────────────
const loginForm = document.getElementById('login-form');
if (loginForm) {
  redirectIfLoggedIn();

  // Toggle password visibility
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-group-custom').querySelector('input');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = loginForm.querySelector('[type=submit]');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember-me')?.checked;

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></span>';

    try {
      const res = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      if (remember) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }

      showToast(`Welcome back, ${user.fullName}! 🎉`, 'success');
      setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 600);
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
  });

  // Pre-fill remembered email
  const rememberedEmail = localStorage.getItem('rememberEmail');
  if (rememberedEmail) {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = rememberedEmail;
      document.getElementById('remember-me').checked = true;
    }
  }

  // Forgot password link
  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    forgotLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      if (!email) { showToast('Please enter your email first', 'warning'); return; }

      try {
        await authAPI.forgotPassword(email);
        showToast('Reset link sent! Check your email.', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to send reset email', 'error');
      }
    });
  }
}

// ── Register Page ─────────────────────────────────────────────
const registerForm = document.getElementById('register-form');
if (registerForm) {
  redirectIfLoggedIn();

  // Password strength indicator
  const passwordInput = document.getElementById('password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const strength = getPasswordStrength(passwordInput.value);
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
      const labels = ['Weak', 'Fair', 'Good', 'Strong'];
      strengthBar.style.width = `${(strength + 1) * 25}%`;
      strengthBar.style.background = colors[strength];
      if (strengthText) strengthText.textContent = labels[strength];
    });
  }

  // Toggle passwords
  document.querySelectorAll('.toggle-password').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.closest('.input-group-custom').querySelector('input');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = registerForm.querySelector('[type=submit]');
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password')?.value;
    const currency = document.getElementById('currency')?.value || 'USD';

    if (confirmPassword && password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;margin:0 auto"></span>';

    try {
      const res = await authAPI.register({ fullName, email, password, currency });
      const { accessToken, refreshToken, user } = res.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      showToast('Account created successfully! 🎉', 'success');
      setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 800);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  });
}

// ── Password Reset Page ───────────────────────────────────────
const resetForm = document.getElementById('reset-password-form');
if (resetForm) {
  const token = new URLSearchParams(window.location.search).get('token');
  if (!token) {
    showToast('Invalid or missing reset token', 'error');
  }

  resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    const btn = resetForm.querySelector('[type=submit]');
    btn.disabled = true;

    try {
      await authAPI.resetPassword({ token, newPassword });
      showToast('Password reset! Redirecting to login...', 'success');
      setTimeout(() => { window.location.href = '/pages/login.html'; }, 1500);
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
      btn.disabled = false;
    }
  });
}

// ── Logout ────────────────────────────────────────────────────
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.clear();
    window.location.href = '/pages/login.html';
  });
}

// ── Helpers ───────────────────────────────────────────────────
function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 3);
}
