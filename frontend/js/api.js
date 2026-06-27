/* ============================================================
   api.js — Axios HTTP Client with Auto Token Refresh
   ============================================================ */

const BASE_URL = 'http://localhost:5000/api/v1';

// ── Axios-like fetch wrapper ─────────────────────────────────
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this._refreshPromise = null;
  }

  _getHeaders(isFormData = false) {
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async _request(method, path, data = null, isFormData = false) {
    const url = `${this.baseURL}${path}`;
    const options = {
      method,
      headers: this._getHeaders(isFormData),
    };

    if (data) {
      options.body = isFormData ? data : JSON.stringify(data);
    }

    let response = await fetch(url, options);

    // Auto-refresh on 401
    if (response.status === 401) {
      const refreshed = await this._refreshToken();
      if (refreshed) {
        options.headers = this._getHeaders(isFormData);
        response = await fetch(url, options);
      } else {
        this._handleLogout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    const json = await response.json().catch(() => ({ success: false, message: 'Invalid response' }));

    if (!response.ok) {
      const error = new Error(json.message || 'Request failed');
      error.status = response.status;
      error.data = json;
      throw error;
    }

    return json;
  }

  async _refreshToken() {
    if (this._refreshPromise) return this._refreshPromise;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    this._refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await response.json();
        if (response.ok && data.data?.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  _handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/pages/login.html';
  }

  get(path)            { return this._request('GET', path); }
  post(path, data)     { return this._request('POST', path, data); }
  put(path, data)      { return this._request('PUT', path, data); }
  delete(path)         { return this._request('DELETE', path); }
  postForm(path, data) { return this._request('POST', path, data, true); }
  putForm(path, data)  { return this._request('PUT', path, data, true); }
}

const api = new ApiClient(BASE_URL);

// ── Auth API ─────────────────────────────────────────────────
export const authAPI = {
  register: (data)          => api.post('/auth/register', data),
  login: (data)             => api.post('/auth/login', data),
  logout: ()                => api.post('/auth/logout'),
  refresh: (token)          => api.post('/auth/refresh', { refreshToken: token }),
  changePassword: (data)    => api.post('/auth/change-password', data),
  forgotPassword: (email)   => api.post('/auth/forgot-password', { email }),
  resetPassword: (data)     => api.post('/auth/reset-password', data),
};

// ── Expense API ───────────────────────────────────────────────
export const expenseAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/expenses${qs ? '?' + qs : ''}`);
  },
  getById: (id)         => api.get(`/expenses/${id}`),
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/expenses/search${qs ? '?' + qs : ''}`);
  },
  create: (data)        => api.post('/expenses', data),
  update: (id, data)    => api.put(`/expenses/${id}`, data),
  delete: (id)          => api.delete(`/expenses/${id}`),
  uploadReceipt: (id, file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.postForm(`/expenses/${id}/receipt`, formData);
  },
  exportCSV: (params = {}) => {
    const token = localStorage.getItem('accessToken');
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/expenses/export/csv${qs ? '?' + qs : ''}`;
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `expenses_${Date.now()}.csv`);
    // We need to fetch with auth header
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  },
  exportPDF: (params = {}) => {
    const token = localStorage.getItem('accessToken');
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/expenses/export/pdf${qs ? '?' + qs : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `expenses_${Date.now()}.pdf`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  },
};

// ── Category API ──────────────────────────────────────────────
export const categoryAPI = {
  getAll: ()              => api.get('/categories'),
  getById: (id)           => api.get(`/categories/${id}`),
  create: (data)          => api.post('/categories', data),
  update: (id, data)      => api.put(`/categories/${id}`, data),
  delete: (id)            => api.delete(`/categories/${id}`),
};

// ── Budget API ────────────────────────────────────────────────
export const budgetAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/budgets${qs ? '?' + qs : ''}`);
  },
  getById: (id)           => api.get(`/budgets/${id}`),
  create: (data)          => api.post('/budgets', data),
  update: (id, data)      => api.put(`/budgets/${id}`, data),
  delete: (id)            => api.delete(`/budgets/${id}`),
};

// ── Analytics API ─────────────────────────────────────────────
export const analyticsAPI = {
  getSummary: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/analytics/summary${qs ? '?' + qs : ''}`);
  },
  getMonthly: (year)      => api.get(`/analytics/monthly${year ? '?year=' + year : ''}`),
  getCategory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/analytics/category${qs ? '?' + qs : ''}`);
  },
  getTrends: (months = 6) => api.get(`/analytics/trends?months=${months}`),
  getTopExpenses: (limit = 5) => api.get(`/analytics/top-expenses?limit=${limit}`),
  getPaymentStats: ()     => api.get('/analytics/payment-methods'),
};

// ── User API ──────────────────────────────────────────────────
export const userAPI = {
  getProfile: ()          => api.get('/users/profile'),
  updateProfile: (data)   => api.put('/users/profile', data),
  uploadPicture: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.postForm('/users/profile-picture', formData);
  },
};

// ── Payment Methods API ───────────────────────────────────────
export const paymentAPI = {
  getAll: ()              => api.get('/payment-methods'),
  getById: (id)           => api.get(`/payment-methods/${id}`),
  create: (data)          => api.post('/payment-methods', data),
  update: (id, data)      => api.put(`/payment-methods/${id}`, data),
  delete: (id)            => api.delete(`/payment-methods/${id}`),
};

// ── Savings Goals API ─────────────────────────────────────────
export const savingsGoalAPI = {
  getAll: ()              => api.get('/savings-goals'),
  getById: (id)           => api.get(`/savings-goals/${id}`),
  create: (data)          => api.post('/savings-goals', data),
  update: (id, data)      => api.put(`/savings-goals/${id}`, data),
  delete: (id)            => api.delete(`/savings-goals/${id}`),
};

// ── Subscriptions API ─────────────────────────────────────────
export const subscriptionAPI = {
  getAll: ()              => api.get('/subscriptions'),
  getById: (id)           => api.get(`/subscriptions/${id}`),
  create: (data)          => api.post('/subscriptions', data),
  update: (id, data)      => api.put(`/subscriptions/${id}`, data),
  delete: (id)            => api.delete(`/subscriptions/${id}`),
};

// ── Bill Reminders API ─────────────────────────────────────────
export const billAPI = {
  getAll: ()              => api.get('/bill-reminders'),
  getById: (id)           => api.get(`/bill-reminders/${id}`),
  create: (data)          => api.post('/bill-reminders', data),
  update: (id, data)      => api.put(`/bill-reminders/${id}`, data),
  delete: (id)            => api.delete(`/bill-reminders/${id}`),
};

// ── Notifications API ─────────────────────────────────────────
export const notificationAPI = {
  getAll: ()              => api.get('/notifications'),
  getUnread: ()           => api.get('/notifications/unread'),
  markRead: (id)          => api.put(`/notifications/${id}/read`),
  markAllRead: ()         => api.put('/notifications/read-all'),
  delete: (id)            => api.delete(`/notifications/${id}`),
};

// ── Achievements API ──────────────────────────────────────────
export const achievementAPI = {
  getAll: ()              => api.get('/achievements'),
};

// ── Recurring Expenses API ────────────────────────────────────
export const recurringExpenseAPI = {
  getAll: ()              => api.get('/recurring-expenses'),
  getById: (id)           => api.get(`/recurring-expenses/${id}`),
  create: (data)          => api.post('/recurring-expenses', data),
  update: (id, data)      => api.put(`/recurring-expenses/${id}`, data),
  delete: (id)            => api.delete(`/recurring-expenses/${id}`),
};

// ── Premium Insights & Analytics API ──────────────────────────
export const premiumAPI = {
  getDashboard: ()        => api.get('/premium/dashboard'),
};

export default api;
