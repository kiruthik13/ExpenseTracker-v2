import Budget from '../models/Budget.js';

class BudgetRepository {
  async create(data) {
    return Budget.create(data);
  }

  async findById(id, userId) {
    return Budget.findOne({ _id: id, userId, isDeleted: false })
      .populate('categoryId', 'name icon color');
  }

  async findByUserId(userId, month = null, year = null) {
    const filter = { userId, isDeleted: false };
    if (month) filter.month = month;
    if (year) filter.year = year;
    return Budget.find(filter)
      .populate('categoryId', 'name icon color')
      .sort({ year: -1, month: -1 });
  }

  async findByUserMonthYear(userId, month, year) {
    return Budget.find({ userId, month, year, isDeleted: false })
      .populate('categoryId', 'name icon color');
  }

  async findByCategory(userId, categoryId, month, year) {
    return Budget.findOne({ userId, categoryId, month, year, isDeleted: false });
  }

  async update(id, userId, updateData) {
    return Budget.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color');
  }

  async updateSpentAmount(id, spentAmount) {
    const budget = await Budget.findById(id);
    if (!budget) return null;
    const remaining = Math.max(0, budget.budgetAmount - spentAmount);
    return Budget.findByIdAndUpdate(
      id,
      { spentAmount, remainingAmount: remaining },
      { new: true }
    );
  }

  async softDelete(id, userId) {
    return Budget.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true },
      { new: true }
    );
  }
}

export default new BudgetRepository();
