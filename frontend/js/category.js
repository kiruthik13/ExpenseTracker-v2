/* ============================================================
   category.js — Categories Page Logic
   ============================================================ */
import { categoryAPI } from './api.js';
import { showToast, showConfirm, requireAuth, loadComponents, initTheme } from './utils.js';

initTheme();
if (!requireAuth()) throw new Error('Not authenticated');

let editingId = null;
const ICON_OPTIONS = [
  'fa-utensils','fa-car','fa-shopping-bag','fa-film','fa-heartbeat',
  'fa-file-invoice','fa-graduation-cap','fa-plane','fa-piggy-bank',
  'fa-briefcase','fa-laptop','fa-chart-line','fa-tag','fa-home',
  'fa-gamepad','fa-tshirt','fa-gift','fa-bus','fa-dumbbell','fa-coffee',
  'fa-music','fa-book','fa-baby','fa-pet','fa-phone','fa-wifi',
  'fa-bolt','fa-tools',
];
const COLOR_OPTIONS = [
  '#1A4731', '#2D6A4F', '#40916C', '#52B788', '#74C69D',
  '#688F78', '#8EA99A', '#A3B899', '#C94444', '#B07300',
  '#5A6354', '#8A9280'
];

let selectedIcon = 'fa-tag';
let selectedColor = '#1A4731';

document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();
  loadCategories();
  renderIconPicker();
  renderColorPicker();
  bindEvents();
});

async function loadCategories() {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;
  grid.innerHTML = Array(4).fill(`<div class="skeleton" style="height:80px;border-radius:12px"></div>`).join('');

  try {
    const res = await categoryAPI.getAll();
    renderCategories(res.data);
  } catch {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><h4>Failed to load categories</h4></div>`;
  }
}

function renderCategories(categories) {
  const grid = document.getElementById('categories-grid');
  if (!grid) return;

  const expenseCategories = categories.filter(c => c.type !== 'income');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const renderGroup = (cats) => cats.map(cat => `
    <div class="category-card animate-fadeInUp" style="background:#fff;border:1px solid var(--color-border);border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;">
      <div class="category-icon-wrap" style="background:${cat.color}15;color:${cat.color};width:48px;height:48px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">
        <i class="fas ${cat.icon}"></i>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:15px;color:var(--color-text-primary);">${cat.name}</div>
        <div style="font-size:12px;color:var(--color-text-muted);margin-top:2px;display:flex;align-items:center;gap:8px;">
          <span class="stat-card-badge" style="background:${cat.type === 'income' ? 'var(--color-income-bg)' : 'var(--color-expense-bg)'};color:${cat.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)'};padding:2px 8px;border-radius:20px;font-size:10px;text-transform:uppercase;font-weight:600;">${cat.type}</span>
          ${cat.budgetLimit > 0 ? `<span style="color:var(--color-text-muted)">Limit: $${cat.budgetLimit}</span>` : ''}
        </div>
      </div>
      ${!cat.isDefault ? `
      <div class="category-actions" style="margin-left:auto;display:flex;gap:6px;">
        <button class="navbar-btn" onclick="editCategory('${cat._id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="navbar-btn btn-danger" style="border:1px solid var(--color-expense);" onclick="deleteCategory('${cat._id}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>` : `<span style="font-size:10px;color:var(--color-text-muted);background:var(--color-bg-page);padding:2px 8px;border-radius:10px">Default</span>`}
    </div>
  `).join('');

  grid.innerHTML = `
    ${expenseCategories.length ? `<div style="grid-column:1/-1;font-size:10px;font-weight:700;color:var(--color-text-hint);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Expense Categories</div>` : ''}
    ${renderGroup(expenseCategories)}
    ${incomeCategories.length ? `<div style="grid-column:1/-1;font-size:10px;font-weight:700;color:var(--color-text-hint);text-transform:uppercase;letter-spacing:1px;margin:12px 0 4px">Income Categories</div>` : ''}
    ${renderGroup(incomeCategories)}
  `;

  setValue('category-count', categories.length);
}

function openModal(cat = null) {
  editingId = cat?._id || null;
  selectedIcon = cat?.icon || 'fa-tag';
  selectedColor = cat?.color || '#1A4731';

  document.getElementById('modal-title').textContent = editingId ? 'Edit Category' : 'New Category';
  document.getElementById('category-form')?.reset();

  if (cat) {
    document.getElementById('cat-name').value = cat.name || '';
    document.getElementById('cat-type').value = cat.type || 'expense';
    document.getElementById('cat-budget').value = cat.budgetLimit || 0;
  }

  updateIconPreview();
  updateColorPreview();
  renderIconPicker();
  renderColorPicker();

  document.getElementById('category-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('category-modal').style.display = 'none';
  editingId = null;
}

async function saveCategory() {
  const btn = document.getElementById('save-cat-btn');
  const name = document.getElementById('cat-name').value.trim();
  if (!name) { showToast('Category name is required', 'error'); return; }

  btn.disabled = true;
  const data = {
    name,
    icon: selectedIcon,
    color: selectedColor,
    type: document.getElementById('cat-type').value,
    budgetLimit: parseFloat(document.getElementById('cat-budget').value || 0),
  };

  try {
    if (editingId) {
      await categoryAPI.update(editingId, data);
      showToast('Category updated ✓', 'success');
    } else {
      await categoryAPI.create(data);
      showToast('Category created ✓', 'success');
    }
    closeModal();
    loadCategories();
  } catch (err) {
    showToast(err.message || 'Failed to save', 'error');
  } finally { btn.disabled = false; }
}

window.editCategory = async (id) => {
  try {
    const res = await categoryAPI.getById(id);
    openModal(res.data);
  } catch { showToast('Failed to load category', 'error'); }
};

window.deleteCategory = async (id) => {
  const confirmed = await showConfirm('Delete Category', 'This will remove the category. Existing expenses will keep their category reference.', 'Delete');
  if (!confirmed) return;
  try {
    await categoryAPI.delete(id);
    showToast('Category deleted', 'success');
    loadCategories();
  } catch (err) { showToast(err.message || 'Failed to delete', 'error'); }
};

function renderIconPicker() {
  const grid = document.getElementById('icon-picker');
  if (!grid) return;
  grid.innerHTML = ICON_OPTIONS.map(icon => `
    <div class="icon-option${icon === selectedIcon ? ' active' : ''}" onclick="selectIcon('${icon}')" style="width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border);border-radius:8px;cursor:pointer;font-size:16px;color:var(--color-text-secondary);transition:all 0.2s;">
      <i class="fas ${icon}"></i>
    </div>
  `).join('');
  
  // Custom styles for active icons
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    .icon-option.active {
      background-color: var(--color-accent) !important;
      border-color: var(--color-accent) !important;
      color: #FFFFFF !important;
    }
    .color-swatch {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      border: 3px solid transparent;
      transition: transform 0.2s;
    }
    .color-swatch:hover { transform: scale(1.1); }
    .color-swatch.active { border-color: var(--color-text-primary); transform: scale(1.1); }
  `;
  document.head.appendChild(styleEl);
}

function renderColorPicker() {
  const grid = document.getElementById('color-picker');
  if (!grid) return;
  grid.innerHTML = COLOR_OPTIONS.map(color => `
    <div class="color-swatch${color === selectedColor ? ' active' : ''}" style="background:${color}" onclick="selectColor('${color}')"></div>
  `).join('');
}

window.selectIcon = (icon) => { selectedIcon = icon; renderIconPicker(); updateIconPreview(); };
window.selectColor = (color) => { selectedColor = color; renderColorPicker(); updateColorPreview(); };

function updateIconPreview() {
  const preview = document.getElementById('icon-preview');
  if (preview) {
    preview.style.background = selectedColor + '15';
    preview.style.color = selectedColor;
    preview.innerHTML = `<i class="fas ${selectedIcon}"></i>`;
  }
}
function updateColorPreview() {
  const el = document.getElementById('color-preview');
  if (el) el.style.background = selectedColor;
  updateIconPreview();
}

function bindEvents() {
  document.getElementById('add-cat-btn')?.addEventListener('click', () => openModal());
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-cat-btn')?.addEventListener('click', closeModal);
  document.getElementById('category-modal')?.addEventListener('click', (e) => { if (e.target.id === 'category-modal') closeModal(); });
  document.getElementById('save-cat-btn')?.addEventListener('click', saveCategory);
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
