import ExpenseRepository from '../repositories/Expense.repository.js';
import BudgetService from './budget.service.js';
import CategoryRepository from '../repositories/Category.repository.js';
import AppError from '../exceptions/AppError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.util.js';
import mongoose from 'mongoose';
import AchievementService from './achievement.service.js';

class ExpenseService {
  _buildFilters(query) {
    const filters = {};
    if (query.type) filters.type = query.type;
    if (query.categoryId) filters.categoryId = new mongoose.Types.ObjectId(query.categoryId);
    if (query.paymentMethodId) filters.paymentMethodId = new mongoose.Types.ObjectId(query.paymentMethodId);
    if (query.startDate || query.endDate) {
      filters.date = {};
      if (query.startDate) filters.date.$gte = new Date(query.startDate);
      if (query.endDate) filters.date.$lte = new Date(query.endDate + 'T23:59:59');
    }
    if (query.minAmount || query.maxAmount) {
      filters.amount = {};
      if (query.minAmount) filters.amount.$gte = parseFloat(query.minAmount);
      if (query.maxAmount) filters.amount.$lte = parseFloat(query.maxAmount);
    }
    return filters;
  }

  async getAll(userId, queryParams = {}) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = 'desc', ...filterParams } = queryParams;
    const filters = this._buildFilters(filterParams);
    return ExpenseRepository.findAll(userId, filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder: sortOrder === 'asc' ? 1 : -1,
    });
  }

  async getById(userId, expenseId) {
    const expense = await ExpenseRepository.findById(expenseId, userId);
    if (!expense) throw new AppError('Expense not found', 404);
    return expense;
  }

  async create(userId, data) {
    const { amount, type = 'expense', categoryId, paymentMethodId, date, description, tags, isRecurring, recurringType } = data;

    // Validate category
    const category = await CategoryRepository.findById(categoryId, userId);
    if (!category) throw new AppError('Category not found', 404);

    let nextRecurringDate = null;
    if (isRecurring && recurringType) {
      nextRecurringDate = this._calculateNextDate(new Date(date || Date.now()), recurringType);
    }

    const expense = await ExpenseRepository.create({
      userId,
      amount,
      type,
      categoryId,
      paymentMethodId: paymentMethodId || null,
      date: date ? new Date(date) : new Date(),
      description,
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringType: isRecurring ? recurringType : null,
      nextRecurringDate,
    });

    // Sync budget if expense type
    if (type === 'expense') {
      const expenseDate = new Date(date || Date.now());
      await BudgetService.syncBudgetSpent(
        userId,
        new mongoose.Types.ObjectId(categoryId),
        expenseDate.getMonth() + 1,
        expenseDate.getFullYear()
      ).catch(() => {});
    }

    // Achievement unlock checks
    try {
      const count = await ExpenseRepository.countForExport(userId);
      if (count === 1) {
        await AchievementService.checkAndUnlock(userId, 'first_expense');
      } else if (count === 100) {
        await AchievementService.checkAndUnlock(userId, 'expense_champion');
      }
    } catch (err) {
      console.error('Achievement verification failed:', err.message);
    }

    return ExpenseRepository.findById(expense._id, userId);
  }

  async update(userId, expenseId, data) {
    const existing = await ExpenseRepository.findById(expenseId, userId);
    if (!existing) throw new AppError('Expense not found', 404);

    if (data.categoryId) {
      const category = await CategoryRepository.findById(data.categoryId, userId);
      if (!category) throw new AppError('Category not found', 404);
    }

    const updated = await ExpenseRepository.update(expenseId, userId, data);

    // Sync budgets for both old and new categories if changed
    const expenseDate = new Date(data.date || existing.date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    if (existing.type === 'expense' || data.type === 'expense') {
      await BudgetService.syncBudgetSpent(userId, existing.categoryId._id, month, year).catch(() => {});
      if (data.categoryId && data.categoryId.toString() !== existing.categoryId._id.toString()) {
        await BudgetService.syncBudgetSpent(userId, new mongoose.Types.ObjectId(data.categoryId), month, year).catch(() => {});
      }
    }

    return updated;
  }

  async delete(userId, expenseId) {
    const existing = await ExpenseRepository.findById(expenseId, userId);
    if (!existing) throw new AppError('Expense not found', 404);

    await ExpenseRepository.softDelete(expenseId, userId);

    // Sync budget
    if (existing.type === 'expense') {
      const expenseDate = new Date(existing.date);
      await BudgetService.syncBudgetSpent(
        userId,
        existing.categoryId._id,
        expenseDate.getMonth() + 1,
        expenseDate.getFullYear()
      ).catch(() => {});
    }

    // Delete receipt if exists
    if (existing.receiptPublicId) {
      await deleteFromCloudinary(existing.receiptPublicId).catch(() => {});
    }

    return true;
  }

  async search(userId, searchQuery, queryParams = {}) {
    const { page = 1, limit = 20, ...filterParams } = queryParams;
    const filters = this._buildFilters(filterParams);
    return ExpenseRepository.search(userId, searchQuery, filters, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  async uploadReceipt(userId, expenseId, file) {
    const expense = await ExpenseRepository.findById(expenseId, userId);
    if (!expense) throw new AppError('Expense not found', 404);

    // Delete old receipt
    if (expense.receiptPublicId) {
      await deleteFromCloudinary(expense.receiptPublicId).catch(() => {});
    }

    let receiptUrl = null;
    let receiptPublicId = null;

    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'expense-tracker/receipts',
      });
      receiptUrl = result.secure_url;
      receiptPublicId = result.public_id;
    } catch (err) {
      receiptUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    return ExpenseRepository.update(expenseId, userId, { receiptUrl, receiptPublicId });
  }

  async exportCSV(userId, queryParams = {}) {
    const filters = this._buildFilters(queryParams);
    const expenses = await ExpenseRepository.findForExport(userId, filters);

    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Payment Method', 'Tags', 'Recurring'];
    const rows = expenses.map((e) => [
      new Date(e.date).toLocaleDateString(),
      e.type,
      e.description || '',
      e.categoryId?.name || '',
      e.amount.toFixed(2),
      e.paymentMethodId?.name || '',
      (e.tags || []).join('; '),
      e.isRecurring ? e.recurringType : 'No',
    ]);

    return { headers, rows, count: expenses.length };
  }

  async exportPDFData(userId, queryParams = {}) {
    const filters = this._buildFilters(queryParams);
    const expenses = await ExpenseRepository.findForExport(userId, filters);
    return expenses;
  }

  _calculateNextDate(fromDate, recurringType) {
    const next = new Date(fromDate);
    switch (recurringType) {
      case 'daily': next.setDate(next.getDate() + 1); break;
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'yearly': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  }
}

// Function exported for cron job — processes due recurring expenses
export const processRecurringExpenses = async () => {
  const expenseService = new ExpenseService();
  const dueExpenses = await ExpenseRepository.findRecurringDue();
  let count = 0;

  for (const expense of dueExpenses) {
    // Create new instance
    await ExpenseRepository.create({
      userId: expense.userId,
      amount: expense.amount,
      type: expense.type,
      categoryId: expense.categoryId,
      paymentMethodId: expense.paymentMethodId,
      date: new Date(),
      description: expense.description,
      tags: expense.tags,
      isRecurring: false,
      parentExpenseId: expense._id,
    });

    // Update next recurring date on parent
    const nextDate = expenseService._calculateNextDate(new Date(), expense.recurringType);
    await ExpenseRepository.update(expense._id, expense.userId, { nextRecurringDate: nextDate });
    count++;
  }

  return count;
};

export default new ExpenseService();
