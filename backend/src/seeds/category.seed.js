const DEFAULT_CATEGORIES = [
  { name: 'Food & Dining', icon: 'fa-utensils', color: '#f59e0b', type: 'expense', budgetLimit: 500 },
  { name: 'Transportation', icon: 'fa-car', color: '#3b82f6', type: 'expense', budgetLimit: 200 },
  { name: 'Shopping', icon: 'fa-shopping-bag', color: '#ec4899', type: 'expense', budgetLimit: 300 },
  { name: 'Entertainment', icon: 'fa-film', color: '#8b5cf6', type: 'expense', budgetLimit: 150 },
  { name: 'Healthcare', icon: 'fa-heartbeat', color: '#ef4444', type: 'expense', budgetLimit: 200 },
  { name: 'Bills & Utilities', icon: 'fa-file-invoice', color: '#6b7280', type: 'expense', budgetLimit: 400 },
  { name: 'Education', icon: 'fa-graduation-cap', color: '#06b6d4', type: 'expense', budgetLimit: 250 },
  { name: 'Travel', icon: 'fa-plane', color: '#10b981', type: 'expense', budgetLimit: 300 },
  { name: 'Savings', icon: 'fa-piggy-bank', color: '#14b8a6', type: 'expense', budgetLimit: 0 },
  { name: 'Salary', icon: 'fa-briefcase', color: '#22c55e', type: 'income', budgetLimit: 0 },
  { name: 'Freelance', icon: 'fa-laptop', color: '#a855f7', type: 'income', budgetLimit: 0 },
  { name: 'Investment', icon: 'fa-chart-line', color: '#f97316', type: 'income', budgetLimit: 0 },
  { name: 'Other Income', icon: 'fa-plus-circle', color: '#84cc16', type: 'income', budgetLimit: 0 },
  { name: 'Other Expense', icon: 'fa-tag', color: '#94a3b8', type: 'expense', budgetLimit: 0 },
];

export const seedDefaultCategories = async (userId) => {
  const CategoryRepository = (await import('../repositories/Category.repository.js')).default;

  const categories = DEFAULT_CATEGORIES.map((cat) => ({
    userId,
    ...cat,
    isDefault: true,
  }));

  await CategoryRepository.bulkCreate(categories);
};

export default DEFAULT_CATEGORIES;
