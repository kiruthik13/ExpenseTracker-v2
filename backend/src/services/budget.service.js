import BudgetRepository from '../repositories/Budget.repository.js';
import CategoryRepository from '../repositories/Category.repository.js';
import ExpenseRepository from '../repositories/Expense.repository.js';
import AppError from '../exceptions/AppError.js';
import mongoose from 'mongoose';

class BudgetService {
  async getAll(userId, month = null, year = null) {
    const budgets = await BudgetRepository.findByUserId(userId, month, year);

    // Update spent amounts in real-time
    const updatedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await ExpenseRepository.getSpentByCategory(
          userId,
          budget.categoryId._id,
          budget.month,
          budget.year
        );
        if (spent !== budget.spentAmount) {
          return BudgetRepository.updateSpentAmount(budget._id, spent);
        }
        return budget;
      })
    );

    return updatedBudgets.filter(Boolean);
  }

  async getById(userId, budgetId) {
    const budget = await BudgetRepository.findById(budgetId, userId);
    if (!budget) throw new AppError('Budget not found', 404);
    return budget;
  }

  async create(userId, data) {
    const { categoryId, month, year, budgetAmount, alertThreshold = 80 } = data;

    // Validate category belongs to user
    const category = await CategoryRepository.findById(categoryId, userId);
    if (!category) throw new AppError('Category not found', 404);

    // Check for duplicate budget
    const existing = await BudgetRepository.findByCategory(userId, categoryId, month, year);
    if (existing) {
      throw new AppError('A budget for this category and month already exists', 409);
    }

    // Calculate current spent amount
    const spentAmount = await ExpenseRepository.getSpentByCategory(
      userId,
      new mongoose.Types.ObjectId(categoryId),
      month,
      year
    );

    const budget = await BudgetRepository.create({
      userId,
      categoryId,
      month,
      year,
      budgetAmount,
      spentAmount,
      remainingAmount: Math.max(0, budgetAmount - spentAmount),
      alertThreshold,
    });

    return BudgetRepository.findById(budget._id, userId);
  }

  async update(userId, budgetId, data) {
    const budget = await BudgetRepository.findById(budgetId, userId);
    if (!budget) throw new AppError('Budget not found', 404);

    if (data.budgetAmount) {
      data.remainingAmount = Math.max(0, data.budgetAmount - budget.spentAmount);
    }

    return BudgetRepository.update(budgetId, userId, data);
  }

  async delete(userId, budgetId) {
    const budget = await BudgetRepository.findById(budgetId, userId);
    if (!budget) throw new AppError('Budget not found', 404);
    await BudgetRepository.softDelete(budgetId, userId);
    return true;
  }

  async syncBudgetSpent(userId, categoryId, month, year) {
    const budget = await BudgetRepository.findByCategory(userId, categoryId, month, year);
    if (!budget) return null;

    const spent = await ExpenseRepository.getSpentByCategory(userId, categoryId, month, year);
    return BudgetRepository.updateSpentAmount(budget._id, spent);
  }
}

export default new BudgetService();
