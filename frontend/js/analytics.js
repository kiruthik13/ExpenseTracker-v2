/* ============================================================
   analytics.js — Analytics Page Logic
   ============================================================ */
import { analyticsAPI } from './api.js';
import { showToast, requireAuth, formatCurrency, loadComponents, initTheme, CHART_COLORS } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

const isDark = () => false; // Always light theme

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await Promise.all([loadSummary(), loadCategoryChart(), loadMonthlyChart(), loadTrendsChart(), loadPaymentChart()]);
  loadTopExpenses();

  // Year selector
  document.getElementById('year-select')?.addEventListener('change', (e) => {
    loadMonthlyChart(e.target.value);
  });
});

// ── Summary ───────────────────────────────────────────────────
async function loadSummary() {
  try {
    const now = new Date();
    const res = await analyticsAPI.getSummary({ month: now.getMonth() + 1, year: now.getFullYear() });
    const d = res.data;
    setValue('analytics-income', formatCurrency(d.totalIncome));
    setValue('analytics-expense', formatCurrency(d.totalExpenses));
    setValue('analytics-balance', formatCurrency(d.balance));
    setValue('analytics-txns', d.transactionCount || 0);
  } catch {}
}

// ── Category Pie Chart ────────────────────────────────────────
async function loadCategoryChart() {
  const canvas = document.getElementById('category-chart');
  if (!canvas) return;
  try {
    const res = await analyticsAPI.getCategory();
    const data = res.data;
    if (!data.length) return;

    if (window.categoryChartInstance) window.categoryChartInstance.destroy();
    window.categoryChartInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.name),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: data.map((d, i) => d.color || CHART_COLORS[i % CHART_COLORS.length]),
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: '#5A6354', font: { family: 'Inter', size: 12 }, boxWidth: 14, padding: 12 } },
          tooltip: getTooltipOptions(),
        },
        cutout: '65%',
      },
    });

    // Legend below
    const legendEl = document.getElementById('category-legend');
    if (legendEl) {
      legendEl.innerHTML = data.slice(0, 8).map((d, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--color-border)">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:10px;height:10px;border-radius:50%;background:${d.color || CHART_COLORS[i % CHART_COLORS.length]}"></div>
            <span style="font-size:13px; color:#1A1F16;">${d.name}</span>
          </div>
          <div style="display:flex;gap:16px;font-size:13px">
            <span style="color:var(--color-text-muted)">${d.percentage}%</span>
            <span style="font-weight:600; color:#1A1F16;">${formatCurrency(d.total)}</span>
          </div>
        </div>
      `).join('');
    }
  } catch {}
}

// ── Monthly Bar Chart ─────────────────────────────────────────
async function loadMonthlyChart(year = null) {
  const canvas = document.getElementById('monthly-chart');
  if (!canvas) return;
  try {
    const res = await analyticsAPI.getMonthly(year);
    const { months } = res.data;
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (window.monthlyChartInstance) window.monthlyChartInstance.destroy();
    window.monthlyChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income',
            data: months.map(m => m.income),
            backgroundColor: 'rgba(26, 71, 49, 0.8)',
            borderRadius: 6,
          },
          {
            label: 'Expenses',
            data: months.map(m => m.expense),
            backgroundColor: 'rgba(201, 68, 68, 0.8)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: getLegendOptions(), tooltip: getTooltipOptions() },
        scales: {
          x: { grid: { color: getGridColor() }, ticks: { color: getTextColor(), font: { family: 'Inter' } } },
          y: { grid: { color: getGridColor() }, ticks: { color: getTextColor(), font: { family: 'Inter' } } },
        },
      },
    });
  } catch {}
}

// ── Trend Line Chart ──────────────────────────────────────────
async function loadTrendsChart() {
  const canvas = document.getElementById('trends-chart');
  if (!canvas) return;
  try {
    const res = await analyticsAPI.getTrends(6);
    const data = res.data;

    if (window.trendsChartInstance) window.trendsChartInstance.destroy();
    window.trendsChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: data.map(d => d.label),
        datasets: [
          {
            label: 'Balance',
            data: data.map(d => d.balance),
            borderColor: '#1A5294',
            backgroundColor: 'rgba(26, 82, 148, 0.1)',
            fill: true, tension: 0.4, borderWidth: 2.5,
            pointBackgroundColor: '#1A5294', pointRadius: 5,
          },
          {
            label: 'Expenses',
            data: data.map(d => d.expense),
            borderColor: '#C94444',
            backgroundColor: 'transparent',
            fill: false, tension: 0.4, borderWidth: 2, borderDash: [5, 5],
            pointBackgroundColor: '#C94444', pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: getLegendOptions(), tooltip: getTooltipOptions() },
        scales: {
          x: { grid: { color: getGridColor() }, ticks: { color: getTextColor(), font: { family: 'Inter' } } },
          y: { grid: { color: getGridColor() }, ticks: { color: getTextColor(), font: { family: 'Inter' } } },
        },
      },
    });
  } catch {}
}

// ── Payment Method Doughnut ───────────────────────────────────
async function loadPaymentChart() {
  const canvas = document.getElementById('payment-chart');
  if (!canvas) return;
  try {
    const res = await analyticsAPI.getPaymentStats();
    const data = res.data;
    if (!data.length) return;

    if (window.paymentChartInstance) window.paymentChartInstance.destroy();
    window.paymentChartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.map(d => d.name || d.type),
        datasets: [{
          data: data.map(d => d.total),
          backgroundColor: CHART_COLORS.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { ...getLegendOptions(), position: 'bottom' }, tooltip: getTooltipOptions() },
      },
    });
  } catch {}
}

// ── Top Expenses ──────────────────────────────────────────────
async function loadTopExpenses() {
  const container = document.getElementById('top-expenses-list');
  if (!container) return;
  try {
    const res = await analyticsAPI.getTopExpenses(5);
    const data = res.data;
    if (!data.length) { container.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:20px">No data</p>'; return; }
    container.innerHTML = data.map((e, i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--color-border)">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--color-accent);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0">${i + 1}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.description || e.categoryId?.name || '-'}</div>
          <div style="font-size:11px;color:var(--color-text-muted)">${e.categoryId?.name || ''}</div>
        </div>
        <div style="font-size:14px;font-weight:700;color:var(--color-expense)">${formatCurrency(e.amount)}</div>
      </div>
    `).join('');
  } catch {}
}

// ── Chart Options Helpers ─────────────────────────────────────
function getTooltipOptions() {
  return {
    backgroundColor: '#ffffff',
    borderColor: '#E4E8E0',
    borderWidth: 1, cornerRadius: 8, padding: 12,
    titleColor: '#1A1F16',
    bodyColor: '#5A6354',
  };
}
function getLegendOptions() {
  return { display: true, labels: { color: getTextColor(), font: { family: 'Inter', size: 12 }, boxWidth: 12 } };
}
function getGridColor()  { return '#E4E8E0'; }
function getTextColor()  { return '#5A6354'; }

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
