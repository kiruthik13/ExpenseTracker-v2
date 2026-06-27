/* ============================================================
   budget.js — Budgets Page Logic
   ============================================================ */
import { budgetAPI, categoryAPI } from './api.js';
import { showToast, showConfirm, requireAuth, formatCurrency, loadComponents, initTheme } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

let categories = [];
let editingId = null;
const now = new Date();

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await loadCategories();

  // Month/year filters
  const monthSelect = document.getElementById('budget-month');
  const yearSelect = document.getElementById('budget-year');
  if (monthSelect) monthSelect.value = now.getMonth() + 1;
  if (yearSelect) {
    const currentYear = now.getFullYear();
    yearSelect.innerHTML = [currentYear - 1, currentYear, currentYear + 1]
      .map(y => `<option value="${y}"${y === currentYear ? ' selected' : ''}>${y}</option>`).join('');
  }

  loadBudgets();
  bindEvents();
});

async function loadCategories() {
  try {
    const res = await categoryAPI.getAll();
    categories = res.data.filter(c => c.type === 'expense' || c.type === 'both');
    populateCategorySelect();
  } catch {}
}

async function loadBudgets() {
  const grid = document.getElementById('budgets-grid');
  if (!grid) return;

  const month = document.getElementById('budget-month')?.value || now.getMonth() + 1;
  const year = document.getElementById('budget-year')?.value || now.getFullYear();

  grid.innerHTML = Array(3).fill(`<div class="skeleton" style="height:140px;border-radius:12px"></div>`).join('');

  try {
    const res = await budgetAPI.getAll({ month, year });
    renderBudgets(res.data);
    updateTotalBudget(res.data);
  } catch {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load budgets</h4></div>`;
  }
}

function renderBudgets(budgets) {
  const grid = document.getElementById('budgets-grid');
  if (!grid) return;

  setValue('budget-count', budgets.length);

  if (!budgets.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-wallet"></i><h4>No budgets for this period</h4><p>Create your first budget to track spending.</p></div>`;
    return;
  }

  grid.innerHTML = budgets.map(b => {
    const pct = b.spentPercentage || 0;
    const isOver = pct >= 100;
    const isNear = pct >= (b.alertThreshold || 80) && !isOver;
    const barClass = isOver ? 'danger' : (isNear ? 'warning' : '');
    const cat = b.categoryId;

    return `
      <div class="budget-card animate-fadeInUp" style="background:#fff;border:1px solid var(--color-border);border-radius:14px;padding:22px;position:relative;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:42px;height:42px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${cat?.color ? cat.color + '15' : 'var(--color-accent-bg)'};color:${cat?.color || 'var(--color-accent)'}">
              <i class="fas ${cat?.icon || 'fa-wallet'}"></i>
            </div>
            <div>
              <div style="font-weight:700;font-size:15px;color:var(--color-text-primary);">${cat?.name || 'Category'}</div>
              <div style="font-size:12px;">
                ${isOver ? '<span style="color:var(--color-expense);font-weight:600">⚠ Over budget!</span>' :
                  isNear ? '<span style="color:var(--color-savings);font-weight:600">⚠ Near limit</span>' :
                  '<span style="color:var(--color-income);font-weight:600">On track</span>'}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="navbar-btn" onclick="editBudget('${b._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="navbar-btn btn-danger" style="border:1px solid var(--color-expense);" onclick="deleteBudget('${b._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>

        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:var(--color-text-secondary)">Spent</span>
            <span style="font-size:13px;font-weight:700;color:${isOver ? 'var(--color-expense)' : 'var(--color-text-primary)'}">${formatCurrency(b.spentAmount)} / ${formatCurrency(b.budgetAmount)}</span>
          </div>
          <div class="progress-custom">
            <div class="progress-bar-custom ${barClass}" style="width:${Math.min(pct, 100)}%"></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--color-text-muted)">${pct}% used</span>
          <span style="font-size:13px;font-weight:600;color:${b.remainingAmount > 0 ? 'var(--color-income)' : 'var(--color-expense)'}">
            ${b.remainingAmount > 0 ? `${formatCurrency(b.remainingAmount)} left` : `${formatCurrency(Math.abs(b.remainingAmount))} over`}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function updateTotalBudget(budgets) {
  const total = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const spent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const remaining = Math.max(0, total - spent);
  setValue('total-budget', formatCurrency(total));
  setValue('total-spent', formatCurrency(spent));
  setValue('total-remaining', formatCurrency(remaining));
}

function openModal(budget = null) {
  editingId = budget?._id || null;
  document.getElementById('modal-title').textContent = editingId ? 'Edit Budget' : 'New Budget';
  document.getElementById('budget-form')?.reset();

  if (budget) {
    document.getElementById('budget-amount').value = budget.budgetAmount;
    document.getElementById('budget-category').value = budget.categoryId?._id;
    document.getElementById('budget-month-input').value = budget.month;
    document.getElementById('budget-year-input').value = budget.year;
    document.getElementById('budget-alert').value = budget.alertThreshold || 80;
  } else {
    document.getElementById('budget-month-input').value = now.getMonth() + 1;
    document.getElementById('budget-year-input').value = now.getFullYear();
    document.getElementById('budget-alert').value = 80;
  }

  document.getElementById('budget-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('budget-modal').style.display = 'none';
  editingId = null;
}

async function saveBudget() {
  const btn = document.getElementById('save-budget-btn');
  btn.disabled = true;

  const data = {
    categoryId: document.getElementById('budget-category').value,
    month: parseInt(document.getElementById('budget-month-input').value),
    year: parseInt(document.getElementById('budget-year-input').value),
    budgetAmount: parseFloat(document.getElementById('budget-amount').value),
    alertThreshold: parseInt(document.getElementById('budget-alert').value || 80),
  };

  try {
    if (editingId) {
      await budgetAPI.update(editingId, data);
      showToast('Budget updated ✓', 'success');
    } else {
      await budgetAPI.create(data);
      showToast('Budget created ✓', 'success');
    }
    closeModal();
    loadBudgets();
  } catch (err) {
    showToast(err.message || 'Failed to save budget', 'error');
  } finally { btn.disabled = false; }
}

window.editBudget = async (id) => {
  try {
    const res = await budgetAPI.getById(id);
    openModal(res.data);
  } catch { showToast('Failed to load budget', 'error'); }
};

window.deleteBudget = async (id) => {
  const confirmed = await showConfirm('Delete Budget', 'Remove this budget tracking?', 'Delete');
  if (!confirmed) return;
  try {
    await budgetAPI.delete(id);
    showToast('Budget deleted', 'success');
    loadBudgets();
  } catch { showToast('Failed to delete', 'error'); }
};

function populateCategorySelect() {
  const select = document.getElementById('budget-category');
  if (!select) return;
  select.innerHTML = '<option value="">Select category</option>' +
    categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

function bindEvents() {
  document.getElementById('add-budget-btn')?.addEventListener('click', () => openModal());
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-budget-btn')?.addEventListener('click', closeModal);
  document.getElementById('budget-modal')?.addEventListener('click', (e) => { if (e.target.id === 'budget-modal') closeModal(); });
  document.getElementById('save-budget-btn')?.addEventListener('click', saveBudget);
  document.getElementById('apply-month-btn')?.addEventListener('click', loadBudgets);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
