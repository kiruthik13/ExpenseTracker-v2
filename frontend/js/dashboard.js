/* ============================================================
   dashboard.js — Dashboard Page Logic
   ============================================================ */
import { analyticsAPI, expenseAPI, premiumAPI, savingsGoalAPI, billAPI, subscriptionAPI, userAPI } from './api.js';
import { showToast, requireAuth, formatCurrency, formatDate, loadComponents, initTheme, getUser, timeAgo } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await Promise.all([
    loadSummary(),
    loadRecentTransactions(),
    loadTrendChart(),
    loadPremiumInfo(),
    loadSavingsProgress(),
    loadUpcomingReminders(),
    loadStreak()
  ]);

  // Quick add expense button
  document.getElementById('quick-add-btn')?.addEventListener('click', () => {
    window.location.href = '/pages/expenses.html?action=add';
  });
});

// ── Summary Cards ─────────────────────────────────────────────
async function loadSummary() {
  try {
    const now = new Date();
    const res = await analyticsAPI.getSummary({ month: now.getMonth() + 1, year: now.getFullYear() });
    const d = res.data;

    setValue('stat-income', formatCurrency(d.totalIncome));
    setValue('stat-expense', formatCurrency(d.totalExpenses));
    setValue('stat-balance', formatCurrency(d.balance));
    setValue('stat-savings', d.savings !== null ? formatCurrency(d.savings) : 'N/A');

    // Color balance (not custom set, style.css handles it, but let's keep it safe)
    const balanceEl = document.getElementById('stat-balance');
    if (balanceEl) balanceEl.style.color = 'var(--color-balance)';

    // Transaction count
    const txnEl = document.getElementById('stat-txn-count');
    const badgeEl = document.getElementById('savings-badge');
    if (badgeEl) {
      badgeEl.textContent = `${d.transactionCount || 0} transactions`;
    } else if (txnEl) {
      txnEl.textContent = d.transactionCount || 0;
    }

    // User greeting (DM Serif Display 28px, custom color)
    const user = getUser();
    const greeting = document.getElementById('dashboard-greeting');
    if (greeting && user) {
      greeting.innerHTML = `Welcome back, <span class="accent-text">${user.fullName.split(' ')[0]}</span> 👋`;
    }
  } catch (err) {
    showToast('Failed to load summary', 'error');
  }
}

// ── Recent Transactions ───────────────────────────────────────
async function loadRecentTransactions() {
  const container = document.getElementById('recent-transactions');
  if (!container) return;

  try {
    const res = await expenseAPI.getAll({ limit: 8, sortBy: 'date', sortOrder: 'desc' });
    const transactions = res.data;

    if (!transactions.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon-box">
            <i class="fas fa-receipt-off"></i>
          </div>
          <h4 class="empty-state-title">No transactions yet</h4>
          <p class="empty-state-body">Add your first expense to start tracking your spending.</p>
          <a href="/pages/expenses.html?action=add" class="btn-outline-custom">Add expense</a>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions.map((t) => `
      <div class="transaction-item">
        <div class="transaction-icon" style="background:${t.categoryId?.color ? t.categoryId.color + '15' : 'var(--color-accent-bg)'}; color:${t.categoryId?.color || 'var(--color-accent)'}">
          <i class="fas ${t.categoryId?.icon || 'fa-tag'}"></i>
        </div>
        <div class="transaction-info">
          <div class="transaction-title">${t.description || t.categoryId?.name || 'Transaction'}</div>
          <div class="transaction-meta">${t.categoryId?.name || 'Unknown'} · ${timeAgo(t.date)}</div>
        </div>
        <div class="transaction-amount ${t.type}">
          ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load</h4></div>`;
  }
}

// ── Expense Trend Chart ───────────────────────────────────────
async function loadTrendChart() {
  const canvas = document.getElementById('trend-chart');
  if (!canvas) return;

  try {
    const res = await analyticsAPI.getTrends(6);
    const trends = res.data;

    const labels = trends.map(t => t.label);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expense);

    // Create gradient fill for income
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 130);
    gradient.addColorStop(0, 'rgba(26, 71, 49, 0.12)');
    gradient.addColorStop(1, 'rgba(26, 71, 49, 0)');

    window.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#1A4731',
            backgroundColor: gradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#1A4731',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#C94444',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 3],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: getChartOptions(),
    });
  } catch (err) {
    console.error(err);
  }
}

// ── Chart options helper ──────────────────────────────────────
function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Custom legend is in HTML
      },
      tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E4E8E0',
        borderWidth: 1,
        titleColor: '#1A1F16',
        bodyColor: '#5A6354',
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#B0B8A8', font: { family: 'Inter', size: 10 } },
      },
      y: {
        grid: { color: '#E4E8E0', drawTicks: false },
        ticks: {
          color: '#B0B8A8',
          font: { family: 'Inter', size: 10 },
          callback: function(value, index, ticks) {
            if (index === ticks.length - 1) return 'High';
            if (index === Math.floor(ticks.length / 2)) return 'Mid';
            if (index === 0) return 'Low';
            return '';
          }
        },
      },
    },
  };
}

// ── Helper ────────────────────────────────────────────────────
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// ── Premium Dashboard Loaders ─────────────────────────────────
async function loadPremiumInfo() {
  try {
    const res = await premiumAPI.getDashboard();
    const d = res.data;

    // 1. Health Score
    const valEl = document.getElementById('health-score-value');
    if (valEl) valEl.textContent = d.healthScore || '0';

    const statusEl = document.getElementById('health-score-status');
    if (statusEl) {
      const score = d.healthScore || 0;
      if (score >= 80) {
        statusEl.textContent = 'Excellent Financial Shape';
        statusEl.style.color = 'var(--color-income)';
      } else if (score >= 50) {
        statusEl.textContent = 'Balanced Budgeting';
        statusEl.style.color = 'var(--color-savings)';
      } else {
        statusEl.textContent = 'Alert: Needs Adjustment';
        statusEl.style.color = 'var(--color-expense)';
      }
    }

    // 2. Prediction
    const predEl = document.getElementById('predicted-spend-val');
    if (predEl && d.prediction) {
      predEl.textContent = formatCurrency(d.prediction.projectedSpent);
    }

    // 3. AI Insights List
    const insightsContainer = document.getElementById('ai-insights-list');
    if (insightsContainer) {
      if (!d.insights || d.insights.length === 0) {
        insightsContainer.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);">No suggestions this period</div>`;
      } else {
        insightsContainer.innerHTML = d.insights.map(ins => {
          const badgeColors = {
            warning: 'background:var(--color-savings-bg);color:var(--color-savings);',
            danger: 'background:var(--color-expense-bg);color:var(--color-expense);',
            info: 'background:var(--color-balance-bg);color:var(--color-balance);',
            success: 'background:var(--color-income-bg);color:var(--color-income);',
          };
          return `
            <div style="padding:10px 14px;border:1px solid var(--color-border);border-radius:10px;display:flex;gap:12px;align-items:flex-start;">
              <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;text-transform:uppercase;${badgeColors[ins.type] || ''}">${ins.type}</span>
              <div style="flex:1;">
                <div style="font-weight:700;font-size:13px;color:var(--color-text-primary);">${ins.title}</div>
                <div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px;line-height:1.4">${ins.message}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load premium insights:', err);
  }
}

async function loadSavingsProgress() {
  const container = document.getElementById('dash-savings-list');
  if (!container) return;

  try {
    const res = await savingsGoalAPI.getAll();
    const goals = res.data.slice(0, 2); // Show top 2 active goals

    if (goals.length === 0) {
      container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);text-align:center;padding:12px;">No active savings targets. <a href="/pages/savings.html" style="color:var(--color-accent);font-weight:600;">Create one</a></div>`;
      return;
    }

    container.innerHTML = goals.map(g => {
      const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
      return `
        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="font-weight:700;color:var(--color-text-primary);">${g.title}</span>
            <span style="color:var(--color-text-secondary);">${formatCurrency(g.currentAmount)} / ${formatCurrency(g.targetAmount)} (${pct}%)</span>
          </div>
          <div class="progress-custom" style="height:6px;background:var(--color-bg-page);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(pct, 100)}%;height:100%;background:var(--color-savings);border-radius:3px;"></div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);">Failed to load savings</div>`;
  }
}

async function loadUpcomingReminders() {
  const container = document.getElementById('dash-bills-list');
  if (!container) return;

  try {
    const [billsRes, subsRes] = await Promise.all([
      billAPI.getAll(),
      subscriptionAPI.getAll()
    ]);

    const unpaidBills = billsRes.data.filter(b => b.status === 'unpaid').map(b => ({
      name: b.title,
      amount: b.amount,
      date: new Date(b.dueDate),
      type: 'Bill'
    }));

    const subs = subsRes.data.map(s => ({
      name: s.name,
      amount: s.amount,
      date: new Date(s.nextBillingDate),
      type: 'Subscription'
    }));

    // Combine and sort by upcoming date
    const allReminders = [...unpaidBills, ...subs]
      .sort((a, b) => a.date - b.date)
      .slice(0, 2);

    if (allReminders.length === 0) {
      container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);text-align:center;padding:12px;">No upcoming reminders.</div>`;
      return;
    }

    container.innerHTML = allReminders.map(rem => {
      const daysLeft = Math.ceil((rem.date - new Date()) / (1000 * 60 * 60 * 24));
      const alertText = daysLeft > 0 ? `In ${daysLeft} days` : `Passed due`;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px;border-radius:8px;background:var(--color-bg-page);font-size:12px;">
          <div>
            <div style="font-weight:700;color:var(--color-text-primary);">${rem.name}</div>
            <div style="font-size:10px;color:var(--color-text-muted);margin-top:2px;">${rem.type} • Due: ${rem.date.toLocaleDateString()}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;color:var(--color-text-primary);">${formatCurrency(rem.amount)}</div>
            <span style="font-size:9px;background:var(--color-accent-bg);color:var(--color-accent);padding:1px 5px;border-radius:10px;font-weight:600;display:inline-block;margin-top:2px;">${alertText}</span>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="font-size:12px;color:var(--color-text-muted);">Failed to load reminders</div>`;
  }
}

async function loadStreak() {
  try {
    const res = await userAPI.getProfile();
    const profile = res.data;

    // Set dashboard streak displays
    const streakEl = document.getElementById('activity-streak-counter');
    if (streakEl) {
      streakEl.textContent = `🔥 ${profile.streakCount || 1} Days`;
    }
  } catch (err) {
    console.error('Failed to load activity streak:', err);
  }
}
