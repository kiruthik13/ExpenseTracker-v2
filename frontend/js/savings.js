/* ============================================================
   savings.js — Savings Goals Page Logic
   ============================================================ */
import { savingsGoalAPI } from './api.js';
import { showToast, showConfirm, requireAuth, formatCurrency, formatDate, loadComponents, initTheme } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

let activeGoals = [];
let editingGoalId = null;
let fundingGoalId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  loadGoals();
  bindEvents();
});

async function loadGoals() {
  const grid = document.getElementById('goals-grid');
  if (!grid) return;
  grid.innerHTML = Array(3).fill(`<div class="skeleton" style="height:160px;border-radius:14px"></div>`).join('');

  try {
    const res = await savingsGoalAPI.getAll();
    activeGoals = res.data;
    renderGoals(activeGoals);
    updateSummaryStats(activeGoals);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-exclamation-circle"></i><h4>Failed to load savings goals</h4></div>`;
  }
}

function renderGoals(goals) {
  const grid = document.getElementById('goals-grid');
  if (!grid) return;

  if (!goals.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-bullseye"></i><h4>No savings goals configured</h4><p>Create your first savings goal to get started!</p></div>`;
    return;
  }

  grid.innerHTML = goals.map(g => {
    const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
    const completed = g.status === 'completed' || pct >= 100;
    const barClass = completed ? 'success' : '';
    
    // Remaining days calculation
    const daysLeft = Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24));
    const timeText = completed ? '<span style="color:var(--color-income);font-weight:600">Goal achieved! 🎉</span>' : 
                     (daysLeft > 0 ? `${daysLeft} days remaining` : `<span style="color:var(--color-expense);font-weight:600">Passed due (${Math.abs(daysLeft)}d)</span>`);

    return `
      <div class="stat-card animate-fadeInUp" style="position:relative;padding:24px;border:1px solid var(--color-border);border-radius:14px;background:#fff;display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <div style="font-weight:700;font-size:16px;color:var(--color-text-primary);">${g.title}</div>
            <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;">Target: ${formatCurrency(g.targetAmount)}</div>
          </div>
          <div style="display:flex;gap:6px">
            ${!completed ? `<button class="navbar-btn" style="background:var(--color-accent-bg);color:var(--color-accent);font-weight:600;padding:2px 8px;font-size:11px;" onclick="openFundsModal('${g._id}')"><i class="fas fa-plus"></i> Add Funds</button>` : ''}
            <button class="navbar-btn" onclick="editGoal('${g._id}')" title="Edit"><i class="fas fa-edit"></i></button>
            <button class="navbar-btn btn-danger" style="border:1px solid var(--color-expense);" onclick="deleteGoal('${g._id}')" title="Delete"><i class="fas fa-trash"></i></button>
          </div>
        </div>

        <div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px">
            <span style="color:var(--color-text-secondary);font-weight:600">${formatCurrency(g.currentAmount)} saved</span>
            <span style="color:var(--color-text-primary);font-weight:700">${pct}%</span>
          </div>
          <div class="progress-custom" style="height:8px;background:var(--color-bg-page);border-radius:4px;overflow:hidden;">
            <div class="progress-bar-custom" style="width:${Math.min(pct, 100)}%;height:100%;background:${completed ? 'var(--color-income)' : 'var(--color-savings)'};border-radius:4px;"></div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;border-top:1px solid var(--color-border);padding-top:10px;">
          <span style="color:var(--color-text-muted)">Due: ${formatDate(g.deadline)}</span>
          <span style="font-size:11px;color:var(--color-text-secondary);">${timeText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateSummaryStats(goals) {
  document.getElementById('total-goals-count').textContent = goals.length;
  const sum = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  document.getElementById('accumulated-savings-sum').textContent = formatCurrency(sum);
}

function openModal(goal = null) {
  editingGoalId = goal?._id || null;
  document.getElementById('modal-title').textContent = editingGoalId ? 'Edit Savings Goal' : 'New Savings Goal';
  document.getElementById('goal-form').reset();

  if (goal) {
    document.getElementById('goal-title').value = goal.title;
    document.getElementById('goal-target').value = goal.targetAmount;
    document.getElementById('goal-current').value = goal.currentAmount;
    document.getElementById('goal-deadline').value = new Date(goal.deadline).toISOString().split('T')[0];
  }

  document.getElementById('goal-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('goal-modal').style.display = 'none';
  editingGoalId = null;
}

window.openFundsModal = (id) => {
  fundingGoalId = id;
  document.getElementById('funds-form').reset();
  document.getElementById('funds-modal').style.display = 'flex';
};

function closeFundsModal() {
  document.getElementById('funds-modal').style.display = 'none';
  fundingGoalId = null;
}

async function saveGoal() {
  const title = document.getElementById('goal-title').value.trim();
  const targetAmount = parseFloat(document.getElementById('goal-target').value);
  const currentAmount = parseFloat(document.getElementById('goal-current').value || 0);
  const deadline = document.getElementById('goal-deadline').value;

  if (!title || isNaN(targetAmount) || targetAmount <= 0 || !deadline) {
    showToast('Please fill out all fields correctly', 'error');
    return;
  }

  const data = { title, targetAmount, currentAmount, deadline };

  try {
    if (editingGoalId) {
      await savingsGoalAPI.update(editingGoalId, data);
      showToast('Savings goal updated successfully ✓', 'success');
    } else {
      await savingsGoalAPI.create(data);
      showToast('Savings goal created successfully ✓', 'success');
    }
    closeModal();
    loadGoals();
  } catch (err) {
    showToast(err.message || 'Failed to save goal', 'error');
  }
}

async function depositFunds() {
  const amount = parseFloat(document.getElementById('funds-amount').value);
  if (isNaN(amount) || amount <= 0) {
    showToast('Please enter a valid amount', 'error');
    return;
  }

  try {
    const goal = activeGoals.find(g => g._id === fundingGoalId);
    if (!goal) return;

    const newAmount = goal.currentAmount + amount;
    await savingsGoalAPI.update(fundingGoalId, { currentAmount: newAmount });
    
    showToast('Funds added successfully! 🎉', 'success');
    closeFundsModal();
    loadGoals();
  } catch (err) {
    showToast(err.message || 'Failed to deposit savings', 'error');
  }
}

window.editGoal = async (id) => {
  const goal = activeGoals.find(g => g._id === id);
  if (goal) openModal(goal);
};

window.deleteGoal = async (id) => {
  const confirmed = await showConfirm('Delete Savings Goal', 'Are you sure you want to remove this savings goal? This cannot be undone.', 'Delete');
  if (!confirmed) return;

  try {
    await savingsGoalAPI.delete(id);
    showToast('Savings goal deleted', 'success');
    loadGoals();
  } catch (err) {
    showToast('Failed to delete goal', 'error');
  }
};

function bindEvents() {
  document.getElementById('add-goal-btn').onclick = () => openModal();
  document.getElementById('close-modal-btn').onclick = closeModal;
  document.getElementById('cancel-goal-btn').onclick = closeModal;
  document.getElementById('save-goal-btn').onclick = saveGoal;

  document.getElementById('close-funds-modal-btn').onclick = closeFundsModal;
  document.getElementById('cancel-funds-btn').onclick = closeFundsModal;
  document.getElementById('save-funds-btn').onclick = depositFunds;
}
