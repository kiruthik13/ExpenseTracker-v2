/* ============================================================
   subscriptions.js — Subscriptions & Bills Page Logic
   ============================================================ */
import { subscriptionAPI, billAPI, expenseAPI, categoryAPI } from './api.js';
import { showToast, showConfirm, requireAuth, formatCurrency, formatDate, loadComponents, initTheme } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

let subscriptionsList = [];
let billsList = [];
let editingSubId = null;
let editingBillId = null;
let categoriesList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  await loadCategories();
  loadData();
  bindEvents();
});

async function loadCategories() {
  try {
    const res = await categoryAPI.getAll();
    categoriesList = res.data;
  } catch {}
}

function loadData() {
  loadSubscriptions();
  loadBills();
}

async function loadSubscriptions() {
  const container = document.getElementById('subs-list');
  if (!container) return;
  container.innerHTML = `<div class="skeleton" style="height:80px;border-radius:12px"></div>`;

  try {
    const res = await subscriptionAPI.getAll();
    subscriptionsList = res.data;
    renderSubscriptions(subscriptionsList);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load subscriptions</h4></div>`;
  }
}

async function loadBills() {
  const container = document.getElementById('bills-list');
  if (!container) return;
  container.innerHTML = `<div class="skeleton" style="height:80px;border-radius:12px"></div>`;

  try {
    const res = await billAPI.getAll();
    billsList = res.data;
    renderBills(billsList);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load bills</h4></div>`;
  }
}

function renderSubscriptions(subs) {
  const container = document.getElementById('subs-list');
  if (!container) return;

  if (!subs.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-credit-card"></i><h4>No subscriptions active</h4></div>`;
    return;
  }

  container.innerHTML = subs.map(s => {
    return `
      <div class="stat-card animate-fadeInUp" style="padding:16px;background:#fff;border:1px solid var(--color-border);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--color-balance-bg);color:var(--color-balance);display:flex;align-items:center;justify-content:center;font-size:18px;">
            <i class="fas fa-rss"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${s.name}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">Renewal: ${formatDate(s.nextBillingDate)} (${s.billingCycle})</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${formatCurrency(s.amount)}</div>
          <div style="display:flex;gap:4px">
            <button class="navbar-btn" onclick="editSub('${s._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="navbar-btn btn-danger" style="border:1px solid var(--color-expense);" onclick="deleteSub('${s._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBills(bills) {
  const container = document.getElementById('bills-list');
  if (!container) return;

  if (!bills.length) {
    container.innerHTML = `<div class="empty-state" style="padding:20px;"><i class="fas fa-file-invoice"></i><h4>No bills due</h4></div>`;
    return;
  }

  container.innerHTML = bills.map(b => {
    const isPaid = b.status === 'paid';
    return `
      <div class="stat-card animate-fadeInUp" style="padding:16px;background:#fff;border:1px solid var(--color-border);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--color-savings-bg);color:var(--color-savings);display:flex;align-items:center;justify-content:center;font-size:18px;">
            <i class="fas fa-file-invoice-dollar"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${b.title}</div>
            <div style="font-size:12px;color:var(--color-text-muted);">Due: ${formatDate(b.dueDate)} • ${b.category || 'Utilities'}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="font-weight:700;font-size:14px;color:var(--color-text-primary);">${formatCurrency(b.amount)}</div>
          <div style="display:flex;gap:4px;align-items:center;">
            ${!isPaid ? `<button class="navbar-btn" style="background:var(--color-accent-bg);color:var(--color-accent);font-weight:600;font-size:11px;padding:4px 8px;" onclick="payBill('${b._id}')"><i class="fas fa-check"></i> Pay</button>` : `<span style="font-size:11px;background:var(--color-income-bg);color:var(--color-income);padding:2px 8px;border-radius:10px;font-weight:600">Paid</span>`}
            <button class="navbar-btn" onclick="editBill('${b._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="navbar-btn btn-danger" style="border:1px solid var(--color-expense);" onclick="deleteBill('${b._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.payBill = async (id) => {
  const bill = billsList.find(b => b._id === id);
  if (!bill) return;

  const confirmed = await showConfirm('Mark Bill as Paid', `This will mark "${bill.title}" as paid and automatically log an expense transaction for ${formatCurrency(bill.amount)}.`, 'Pay Bill', 'confirm');
  if (!confirmed) return;

  try {
    // 1. Find matching category or default category
    const cat = categoriesList.find(c => c.name.toLowerCase() === 'bills' || c.name.toLowerCase() === 'utilities') || categoriesList[0];
    if (!cat) throw new Error('No category available. Please create a category first.');

    // 2. Log transaction
    await expenseAPI.create({
      amount: bill.amount,
      type: 'expense',
      categoryId: cat._id,
      date: new Date(),
      description: `Paid Bill: ${bill.title}`
    });

    // 3. Mark bill paid
    await billAPI.update(id, { status: 'paid' });
    showToast('Bill marked as paid and logged successfully! ✓', 'success');
    loadData();
  } catch (err) {
    showToast(err.message || 'Failed to pay bill', 'error');
  }
};

// Modal operations
function openSubModal(sub = null) {
  editingSubId = sub?._id || null;
  document.getElementById('sub-modal-title').textContent = editingSubId ? 'Edit Subscription' : 'New Subscription';
  document.getElementById('sub-form').reset();

  if (sub) {
    document.getElementById('sub-name').value = sub.name;
    document.getElementById('sub-amount').value = sub.amount;
    document.getElementById('sub-cycle').value = sub.billingCycle;
    document.getElementById('sub-date').value = new Date(sub.nextBillingDate).toISOString().split('T')[0];
  }

  document.getElementById('sub-modal').style.display = 'flex';
}

function closeSubModal() {
  document.getElementById('sub-modal').style.display = 'none';
  editingSubId = null;
}

function openBillModal(bill = null) {
  editingBillId = bill?._id || null;
  document.getElementById('bill-modal-title').textContent = editingBillId ? 'Edit Bill Reminder' : 'New Bill Reminder';
  document.getElementById('bill-form').reset();

  if (bill) {
    document.getElementById('bill-title').value = bill.title;
    document.getElementById('bill-amount').value = bill.amount;
    document.getElementById('bill-cat').value = bill.category || 'Utilities';
    document.getElementById('bill-date').value = new Date(bill.dueDate).toISOString().split('T')[0];
  }

  document.getElementById('bill-modal').style.display = 'flex';
}

function closeBillModal() {
  document.getElementById('bill-modal').style.display = 'none';
  editingBillId = null;
}

async function saveSub() {
  const name = document.getElementById('sub-name').value.trim();
  const amount = parseFloat(document.getElementById('sub-amount').value);
  const cycle = document.getElementById('sub-cycle').value;
  const date = document.getElementById('sub-date').value;

  if (!name || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please fill out all fields', 'error');
    return;
  }

  const data = { name, amount, billingCycle: cycle, nextBillingDate: date };

  try {
    if (editingSubId) {
      await subscriptionAPI.update(editingSubId, data);
      showToast('Subscription updated ✓', 'success');
    } else {
      await subscriptionAPI.create(data);
      showToast('Subscription created ✓', 'success');
    }
    closeSubModal();
    loadSubscriptions();
  } catch (err) {
    showToast(err.message || 'Failed to save', 'error');
  }
}

async function saveBill() {
  const title = document.getElementById('bill-title').value.trim();
  const amount = parseFloat(document.getElementById('bill-amount').value);
  const category = document.getElementById('bill-cat').value.trim();
  const date = document.getElementById('bill-date').value;

  if (!title || isNaN(amount) || amount <= 0 || !date) {
    showToast('Please fill out all fields', 'error');
    return;
  }

  const data = { title, amount, category, dueDate: date };

  try {
    if (editingBillId) {
      await billAPI.update(editingBillId, data);
      showToast('Bill reminder updated ✓', 'success');
    } else {
      await billAPI.create(data);
      showToast('Bill reminder created ✓', 'success');
    }
    closeBillModal();
    loadBills();
  } catch (err) {
    showToast(err.message || 'Failed to save', 'error');
  }
}

window.editSub = (id) => {
  const sub = subscriptionsList.find(s => s._id === id);
  if (sub) openSubModal(sub);
};

window.editBill = (id) => {
  const bill = billsList.find(b => b._id === id);
  if (bill) openBillModal(bill);
};

window.deleteSub = async (id) => {
  const confirmed = await showConfirm('Remove Subscription', 'Are you sure you want to stop tracking this subscription?', 'Remove');
  if (!confirmed) return;
  try {
    await subscriptionAPI.delete(id);
    showToast('Subscription removed', 'success');
    loadSubscriptions();
  } catch {
    showToast('Failed to delete', 'error');
  }
};

window.deleteBill = async (id) => {
  const confirmed = await showConfirm('Remove Bill Reminder', 'Are you sure you want to delete this bill reminder?', 'Delete');
  if (!confirmed) return;
  try {
    await billAPI.delete(id);
    showToast('Bill reminder deleted', 'success');
    loadBills();
  } catch {
    showToast('Failed to delete', 'error');
  }
};

function bindEvents() {
  document.getElementById('add-sub-btn').onclick = () => openSubModal();
  document.getElementById('close-sub-modal-btn').onclick = closeSubModal;
  document.getElementById('cancel-sub-btn').onclick = closeSubModal;
  document.getElementById('save-sub-btn').onclick = saveSub;

  document.getElementById('add-bill-btn').onclick = () => openBillModal();
  document.getElementById('close-bill-modal-btn').onclick = closeBillModal;
  document.getElementById('cancel-bill-btn').onclick = closeBillModal;
  document.getElementById('save-bill-btn').onclick = saveBill;
}
