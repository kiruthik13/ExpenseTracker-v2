import ExpenseRepository from '../repositories/Expense.repository.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

class AnalyticsService {
  async getSummary(userId, month = null, year = null) {
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate totals for current period
    const [periodData, allTimeData] = await Promise.all([
      ExpenseRepository.findByDateRange(userObjectId, startDate, endDate),
      ExpenseRepository.findAll(userObjectId, {}, { limit: 0 }),
    ]);

    // Use direct aggregation for accuracy
    const periodAgg = await this._aggregatePeriod(userObjectId, startDate, endDate);

    const totalIncome = periodAgg.income || 0;
    const totalExpenses = periodAgg.expense || 0;
    const balance = totalIncome - totalExpenses;

    // Get user monthly income setting
    const user = await User.findById(userId).select('monthlyIncome currency');
    const monthlyIncomeSetting = user?.monthlyIncome || 0;

    // All-time totals
    const allTimeAgg = await this._aggregateAllTime(userObjectId);

    return {
      period: { month: targetMonth, year: targetYear },
      totalIncome,
      totalExpenses,
      balance,
      monthlyIncomeSetting,
      currency: user?.currency || 'USD',
      savings: monthlyIncomeSetting > 0 ? monthlyIncomeSetting - totalExpenses : null,
      allTime: allTimeAgg,
      transactionCount: periodAgg.count || 0,
    };
  }

  async getMonthly(userId, year = null) {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const data = await ExpenseRepository.getSummaryByMonth(userObjectId, targetYear);

    // Build full 12-month chart
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      income: 0,
      expense: 0,
    }));

    data.forEach((item) => {
      const monthIndex = item._id.month - 1;
      if (item._id.type === 'income') {
        months[monthIndex].income = item.total;
      } else {
        months[monthIndex].expense = item.total;
      }
    });

    return { year: targetYear, months };
  }

  async getCategoryBreakdown(userId, startDate, endDate) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const data = await ExpenseRepository.getCategoryBreakdown(userObjectId, start, end);
    const total = data.reduce((sum, item) => sum + item.total, 0);

    return data.map((item) => ({
      categoryId: item._id,
      name: item.category?.name,
      icon: item.category?.icon,
      color: item.category?.color,
      total: item.total,
      count: item.count,
      percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
    }));
  }

  async getTrends(userId, months = 6) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const now = new Date();
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const agg = await this._aggregatePeriod(userObjectId, start, end);
      results.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
        income: agg.income || 0,
        expense: agg.expense || 0,
        balance: (agg.income || 0) - (agg.expense || 0),
      });
    }

    return results;
  }

  async getTopExpenses(userId, limit = 5, startDate = null, endDate = null) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    return ExpenseRepository.getTopExpenses(userObjectId, start, end, parseInt(limit));
  }

  async getPaymentMethodStats(userId, startDate = null, endDate = null) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    const data = await ExpenseRepository.getPaymentMethodBreakdown(userObjectId, start, end);
    const total = data.reduce((sum, item) => sum + item.total, 0);

    return data.map((item) => ({
      paymentMethodId: item._id,
      name: item.paymentMethod?.name,
      type: item.paymentMethod?.type,
      total: item.total,
      count: item.count,
      percentage: total > 0 ? Math.round((item.total / total) * 100) : 0,
    }));
  }

  async _aggregatePeriod(userId, startDate, endDate) {
    const result = await mongoose.model('Expense').aggregate([
      {
        $match: {
          userId,
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const data = { income: 0, expense: 0, count: 0 };
    result.forEach((r) => {
      data[r._id] = r.total;
      data.count += r.count;
    });
    return data;
  }

  async _aggregateAllTime(userId) {
    const result = await mongoose.model('Expense').aggregate([
      { $match: { userId, isDeleted: false } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const data = { income: 0, expense: 0, count: 0 };
    result.forEach((r) => {
      data[r._id] = r.total;
      data.count += r.count;
    });
    return data;
  }
}

export default new AnalyticsService();
