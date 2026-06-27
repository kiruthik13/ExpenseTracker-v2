/* ============================================================
   expense.js — Expenses Page Logic
   ============================================================ */
import { expenseAPI, categoryAPI, paymentAPI } from './api.js';
import { showToast, showConfirm, requireAuth, formatCurrency, formatDate, loadComponents, initTheme, debounce, renderPagination } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

// State
let categories = [], paymentMethods = [];
let currentPage = 1, totalPages = 1;
let editingId = null;
let currentFilters = {};
let tagsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await Promise.all([loadCategories(), loadPaymentMethods()]);
  await loadExpenses();

  // Open add modal from URL param
  if (new URLSearchParams(window.location.search).get('action') === 'add') {
    openModal();
  }

  bindEvents();
});

// ── Load & Render ─────────────────────────────────────────────
async function loadExpenses() {
  showTableLoading();
  try {
    const params = { page: currentPage, limit: 15, ...currentFilters };
    const res = await expenseAPI.getAll(params);
    totalPages = res.pagination?.totalPages || 1;
    renderExpenses(res.data);
    renderPagination('pagination-container', currentPage, totalPages, (page) => {
      currentPage = page;
      loadExpenses();
    });
    setValue('total-count', res.pagination?.totalDocs || 0);
  } catch {
    showTableError();
  }
}

function renderExpenses(expenses) {
  const tbody = document.getElementById('expenses-tbody');
  if (!tbody) return;

  if (!expenses.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state" style="padding:40px"><i class="fas fa-receipt"></i><h4>No expenses found</h4><p>Try adjusting your filters or add a new expense.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = expenses.map((e) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:36px;height:36px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;background:${e.categoryId?.color ? e.categoryId.color + '20' : 'rgba(139,92,246,0.1)'};color:${e.categoryId?.color || '#8b5cf6'}">
            <i class="fas ${e.categoryId?.icon || 'fa-tag'}"></i>
          </div>
          <div>
            <div style="font-weight:600;font-size:14px">${e.description || e.categoryId?.name || '-'}</div>
            <div style="font-size:11px;color:var(--text-muted)">${(e.tags || []).join(', ') || ''}</div>
          </div>
        </div>
      </td>
      <td><span class="badge ${e.type === 'income' ? 'badge-income' : 'badge-expense'}">${e.type}</span></td>
      <td><span style="color:${e.categoryId?.color || 'var(--color-primary)'}">${e.categoryId?.name || '-'}</span></td>
      <td style="font-weight:700;color:${e.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)'}">
        ${e.type === 'income' ? '+' : '-'}${formatCurrency(e.amount)}
      </td>
      <td>${formatDate(e.date)}</td>
      <td>${e.paymentMethodId?.name || '-'}</td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          ${e.receiptUrl ? `<a href="${e.receiptUrl}" target="_blank" class="navbar-btn" title="View Receipt"><i class="fas fa-receipt"></i></a>` : ''}
          <button class="navbar-btn" onclick="editExpense('${e._id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="navbar-btn btn-danger" style="border:none" onclick="deleteExpense('${e._id}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(expense = null) {
  editingId = expense?._id || null;
  tagsList = expense?.tags || [];

  const modal = document.getElementById('expense-modal');
  const title = document.getElementById('modal-title');
  if (modal) modal.style.display = 'flex';
  if (title) title.textContent = editingId ? 'Edit Expense' : 'Add Expense';

  // Populate form
  if (expense) {
    setValue('input-amount', expense.amount);
    setValue('input-description', expense.description);
    setValue('select-type', expense.type);
    setValue('select-category', expense.categoryId?._id);
    setValue('select-payment', expense.paymentMethodId?._id);
    setValue('input-date', formatDate(expense.date, 'input'));
    setValue('input-recurring', expense.isRecurring);
    setValue('select-recurring-type', expense.recurringType);
    renderTags();
  } else {
    document.getElementById('expense-form')?.reset();
    setValue('input-date', formatDate(new Date(), 'input'));
    tagsList = [];
    renderTags();
  }

  populateCategorySelect();
  populatePaymentSelect();
}

function closeModal() {
  const modal = document.getElementById('expense-modal');
  if (modal) modal.style.display = 'none';
  editingId = null;
  tagsList = [];
}

// ── CRUD ──────────────────────────────────────────────────────
async function saveExpense() {
  const btn = document.getElementById('save-expense-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block"></span>';

  const data = {
    amount: parseFloat(document.getElementById('input-amount').value),
    type: document.getElementById('select-type').value,
    categoryId: document.getElementById('select-category').value,
    paymentMethodId: document.getElementById('select-payment')?.value || null,
    date: document.getElementById('input-date')?.value,
    description: document.getElementById('input-description')?.value?.trim(),
    tags: tagsList,
    isRecurring: document.getElementById('input-recurring')?.checked || false,
    recurringType: document.getElementById('select-recurring-type')?.value || null,
  };

  if (!data.paymentMethodId) delete data.paymentMethodId;

  try {
    if (editingId) {
      await expenseAPI.update(editingId, data);
      showToast('Expense updated ✓', 'success');
    } else {
      const res = await expenseAPI.create(data);
      showToast('Expense added ✓', 'success');

      // Handle receipt upload
      const receiptFile = document.getElementById('receipt-input')?.files[0];
      if (receiptFile && res.data._id) {
        await expenseAPI.uploadReceipt(res.data._id, receiptFile).catch(() => {});
      }
    }
    closeModal();
    loadExpenses();
  } catch (err) {
    showToast(err.message || 'Failed to save expense', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = editingId ? 'Update Expense' : 'Add Expense';
  }
}

window.editExpense = async (id) => {
  try {
    const res = await expenseAPI.getById(id);
    openModal(res.data);
  } catch { showToast('Failed to load expense', 'error'); }
};

window.deleteExpense = async (id) => {
  const confirmed = await showConfirm('Delete Expense', 'This action cannot be undone.', 'Delete');
  if (!confirmed) return;
  try {
    await expenseAPI.delete(id);
    showToast('Expense deleted', 'success');
    loadExpenses();
  } catch { showToast('Failed to delete', 'error'); }
};

// ── Tags ──────────────────────────────────────────────────────
function renderTags() {
  const container = document.getElementById('tags-container');
  if (!container) return;
  container.innerHTML = tagsList.map(t => `
    <span class="tag-pill">${t}<span class="remove-tag" onclick="removeTag('${t}')"><i class="fas fa-times"></i></span></span>
  `).join('');
}

window.removeTag = (tag) => {
  tagsList = tagsList.filter(t => t !== tag);
  renderTags();
};

// ── Filters ───────────────────────────────────────────────────
function applyFilters() {
  const type = document.getElementById('filter-type')?.value;
  const category = document.getElementById('filter-category')?.value;
  const startDate = document.getElementById('filter-start-date')?.value;
  const endDate = document.getElementById('filter-end-date')?.value;
  const minAmount = document.getElementById('filter-min-amount')?.value;
  const maxAmount = document.getElementById('filter-max-amount')?.value;

  currentFilters = {};
  if (type) currentFilters.type = type;
  if (category) currentFilters.categoryId = category;
  if (startDate) currentFilters.startDate = startDate;
  if (endDate) currentFilters.endDate = endDate;
  if (minAmount) currentFilters.minAmount = minAmount;
  if (maxAmount) currentFilters.maxAmount = maxAmount;

  currentPage = 1;
  loadExpenses();
}

function clearFilters() {
  document.getElementById('filter-type')?.value && (document.getElementById('filter-type').value = '');
  ['filter-category', 'filter-start-date', 'filter-end-date', 'filter-min-amount', 'filter-max-amount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  currentFilters = {};
  currentPage = 1;
  loadExpenses();
}

// ── Search ────────────────────────────────────────────────────
const doSearch = debounce(async (q) => {
  if (!q.trim()) { loadExpenses(); return; }
  showTableLoading();
  try {
    const res = await expenseAPI.search({ q, page: 1, limit: 15, ...currentFilters });
    totalPages = res.pagination?.totalPages || 1;
    renderExpenses(res.data);
    renderPagination('pagination-container', 1, totalPages, (page) => {
      currentPage = page;
      loadExpenses();
    });
  } catch { showTableError(); }
}, 400);

// ── Helpers ───────────────────────────────────────────────────
async function loadCategories() {
  try {
    const res = await categoryAPI.getAll();
    categories = res.data;
    populateCategorySelect();
    populateFilterCategory();
  } catch {}
}

async function loadPaymentMethods() {
  try {
    const res = await paymentAPI.getAll();
    paymentMethods = res.data;
    populatePaymentSelect();
  } catch {}
}

function populateCategorySelect() {
  const select = document.getElementById('select-category');
  if (!select) return;
  select.innerHTML = '<option value="">Select category</option>' +
    categories.map(c => `<option value="${c._id}">${c.icon ? '' : ''}${c.name}</option>`).join('');
}

function populatePaymentSelect() {
  const select = document.getElementById('select-payment');
  if (!select) return;
  select.innerHTML = '<option value="">No payment method</option>' +
    paymentMethods.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
}

function populateFilterCategory() {
  const select = document.getElementById('filter-category');
  if (!select) return;
  select.innerHTML = '<option value="">All Categories</option>' +
    categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');
}

function showTableLoading() {
  const tbody = document.getElementById('expenses-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px"><div class="spinner" style="margin:0 auto"></div></td></tr>`;
}

function showTableError() {
  const tbody = document.getElementById('expenses-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load expenses</h4></div></td></tr>`;
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.type === 'checkbox') el.checked = !!value;
  else el.value = value || '';
}

// ── Bind Events ───────────────────────────────────────────────
function bindEvents() {
  // Add button
  document.getElementById('add-expense-btn')?.addEventListener('click', () => openModal());
  document.getElementById('fab-add-btn')?.addEventListener('click', () => openModal());

  // Modal close
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-expense-btn')?.addEventListener('click', closeModal);
  document.getElementById('expense-modal')?.addEventListener('click', (e) => { if (e.target.id === 'expense-modal') closeModal(); });

  // Save
  document.getElementById('save-expense-btn')?.addEventListener('click', saveExpense);

  // Search
  document.getElementById('expense-search')?.addEventListener('input', (e) => doSearch(e.target.value));

  // Filters
  document.getElementById('apply-filters-btn')?.addEventListener('click', applyFilters);
  document.getElementById('clear-filters-btn')?.addEventListener('click', clearFilters);

  // Export
  document.getElementById('export-csv-btn')?.addEventListener('click', () => expenseAPI.exportCSV(currentFilters));
  document.getElementById('export-pdf-btn')?.addEventListener('click', () => expenseAPI.exportPDF(currentFilters));

  // Tags input
  const tagInput = document.getElementById('tag-input');
  if (tagInput) {
    tagInput.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ',') && tagInput.value.trim()) {
        e.preventDefault();
        const tag = tagInput.value.trim().replace(',', '');
        if (!tagsList.includes(tag)) { tagsList.push(tag); renderTags(); }
        tagInput.value = '';
      }
    });
  }

  // Recurring type visibility
  document.getElementById('input-recurring')?.addEventListener('change', (e) => {
    const wrapper = document.getElementById('recurring-type-wrapper');
    if (wrapper) wrapper.style.display = e.target.checked ? 'block' : 'none';
  });

  // Receipt preview
  document.getElementById('receipt-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    const preview = document.getElementById('receipt-preview');
    if (file && preview) {
      const reader = new FileReader();
      reader.onload = (ev) => { preview.src = ev.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    }
  });
}
