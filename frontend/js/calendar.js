/* ============================================================
   calendar.js — Expense Calendar Page Logic
   ============================================================ */
import { expenseAPI } from './api.js';
import { showToast, requireAuth, loadComponents, initTheme, formatCurrency, formatDate } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

let currentDate = new Date();
let monthlyExpenses = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  setupCalendarNav();
  await loadMonthData();
});

function setupCalendarNav() {
  document.getElementById('prev-month-btn').onclick = async () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    await loadMonthData();
  };
  document.getElementById('next-month-btn').onclick = async () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    await loadMonthData();
  };
  document.getElementById('close-day-modal-btn').onclick = closeDayModal;
  document.getElementById('calendar-day-modal').onclick = (e) => {
    if (e.target.id === 'calendar-day-modal') closeDayModal();
  };
}

async function loadMonthData() {
  const monthYearStr = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  document.getElementById('current-month-year').textContent = monthYearStr;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Set grid to skeleton loading state
  const grid = document.getElementById('calendar-days');
  grid.innerHTML = Array(35).fill('<div class="skeleton" style="height:100px;border-radius:8px"></div>').join('');

  try {
    // Fetch all transactions (un-paginated or retrieve page 1 with large limit e.g. 500)
    const res = await expenseAPI.getAll({ limit: 500 });
    monthlyExpenses = res.data.docs.filter(item => {
      const d = new Date(item.date);
      return d.getFullYear() === year && (d.getMonth() + 1) === month;
    });

    renderCalendar();
  } catch (err) {
    showToast('Failed to load transaction calendar data', 'error');
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendar-days');
  grid.innerHTML = '';

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // 1. Render blank/prev month days
  for (let i = firstDayIndex; i > 0; i--) {
    const day = prevMonthTotalDays - i + 1;
    grid.innerHTML += `
      <div style="background:var(--color-bg-page);border:1px solid var(--color-border);border-radius:8px;padding:8px;opacity:0.4;min-height:100px;display:flex;flex-direction:column;justify-content:space-between;">
        <span style="font-size:12px;font-weight:700;color:var(--color-text-muted);">${day}</span>
      </div>`;
  }

  // 2. Render current month days
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayDate = new Date(year, month, day);

    // Filter transactions for this day
    const dayTxns = monthlyExpenses.filter(item => {
      const itemD = new Date(item.date);
      return itemD.getDate() === day && itemD.getMonth() === month && itemD.getFullYear() === year;
    });

    const incomeSum = dayTxns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenseSum = dayTxns.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const isToday = new Date().toDateString() === dayDate.toDateString();

    let borderStyle = '1px solid var(--color-border)';
    let bgStyle = '#FFFFFF';
    if (isToday) {
      borderStyle = '2px solid var(--color-accent)';
      bgStyle = 'var(--color-accent-bg)';
    }

    const clickAttr = dayTxns.length > 0 ? `onclick="openDayModal('${dateStr}', ${day})"` : '';
    const cursorStyle = dayTxns.length > 0 ? 'cursor:pointer;' : '';

    grid.innerHTML += `
      <div ${clickAttr} style="background:${bgStyle};border:${borderStyle};border-radius:8px;padding:8px;min-height:100px;display:flex;flex-direction:column;justify-content:space-between;transition:all 0.2s;${cursorStyle}" class="calendar-cell">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-size:12px;font-weight:700;color:${isToday ? 'var(--color-accent)' : 'var(--color-text-primary)'};">${day}</span>
          ${dayTxns.length > 0 ? `<span style="font-size:9px;background:var(--color-border);padding:1px 5px;border-radius:10px;font-weight:600;color:var(--color-text-secondary);">${dayTxns.length} tx</span>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;align-items:flex-end;">
          ${incomeSum > 0 ? `<span style="font-size:10px;color:var(--color-income);font-weight:700;">+${formatCurrency(incomeSum)}</span>` : ''}
          ${expenseSum > 0 ? `<span style="font-size:10px;color:var(--color-expense);font-weight:700;">-${formatCurrency(expenseSum)}</span>` : ''}
        </div>
      </div>`;
  }
}

window.openDayModal = (dateStr, dayNum) => {
  const modal = document.getElementById('calendar-day-modal');
  const title = document.getElementById('day-modal-title');
  const list = document.getElementById('day-txns-list');

  const selectedDate = new Date(dateStr);
  title.textContent = selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Get items
  const dayTxns = monthlyExpenses.filter(item => {
    const itemD = new Date(item.date);
    return itemD.getDate() === dayNum;
  });

  list.innerHTML = dayTxns.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--color-bg-page);border-radius:10px;">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:${t.categoryId?.color ? t.categoryId.color + '15' : 'var(--color-accent-bg)'};color:${t.categoryId?.color || 'var(--color-accent)'}">
          <i class="fas ${t.categoryId?.icon || 'fa-receipt'}"></i>
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${t.description || t.categoryId?.name || 'Transaction'}</div>
          <div style="font-size:11px;color:var(--color-text-muted);">${formatDate(t.date)} • ${t.paymentMethodId?.name || 'Cash'}</div>
        </div>
      </div>
      <div style="font-weight:700;font-size:14px;color:${t.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'};">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
};

function closeDayModal() {
  document.getElementById('calendar-day-modal').style.display = 'none';
}
