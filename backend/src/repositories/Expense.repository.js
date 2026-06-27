import Expense from '../models/Expense.js';

class ExpenseRepository {
  async create(data) {
    return Expense.create(data);
  }

  async findById(id, userId) {
    return Expense.findOne({ _id: id, userId, isDeleted: false })
      .populate('categoryId', 'name icon color type')
      .populate('paymentMethodId', 'name type');
  }

  async findAll(userId, filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'date', sortOrder = -1 } = options;
    const skip = (page - 1) * limit;

    const query = { userId, isDeleted: false, ...filters };
    const sort = { [sortBy]: sortOrder };

    const docs = await Expense.find(query)
      .populate('categoryId', 'name icon color type')
      .populate('paymentMethodId', 'name type')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalDocs = await Expense.countDocuments(query);

    return {
      docs,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      page,
      limit,
    };
  }

  async search(userId, searchQuery, filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const query = {
      userId,
      isDeleted: false,
      ...filters,
      ...(searchQuery && {
        $or: [
          { description: { $regex: searchQuery, $options: 'i' } },
          { tags: { $in: [new RegExp(searchQuery, 'i')] } },
        ],
      }),
    };

    const docs = await Expense.find(query)
      .populate('categoryId', 'name icon color type')
      .populate('paymentMethodId', 'name type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalDocs = await Expense.countDocuments(query);

    return {
      docs,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      page,
      limit,
    };
  }

  async update(id, userId, updateData) {
    return Expense.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    )
      .populate('categoryId', 'name icon color type')
      .populate('paymentMethodId', 'name type');
  }

  async softDelete(id, userId) {
    return Expense.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true, status: 'deleted' },
      { new: true }
    );
  }

  async findByDateRange(userId, startDate, endDate, type = null) {
    const query = {
      userId,
      isDeleted: false,
      date: { $gte: startDate, $lte: endDate },
    };
    if (type) query.type = type;
    return Expense.find(query).populate('categoryId', 'name icon color type');
  }

  async findRecurringDue() {
    return Expense.find({
      isRecurring: true,
      isDeleted: false,
      nextRecurringDate: { $lte: new Date() },
    });
  }

  async getSummaryByMonth(userId, year) {
    return Expense.aggregate([
      {
        $match: {
          userId: userId,
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);
  }

  async getCategoryBreakdown(userId, startDate, endDate) {
    return Expense.aggregate([
      {
        $match: {
          userId: userId,
          isDeleted: false,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$categoryId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $sort: { total: -1 } },
    ]);
  }

  async getPaymentMethodBreakdown(userId, startDate, endDate) {
    return Expense.aggregate([
      {
        $match: {
          userId: userId,
          isDeleted: false,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
          paymentMethodId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$paymentMethodId',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'paymentmethods',
          localField: '_id',
          foreignField: '_id',
          as: 'paymentMethod',
        },
      },
      { $unwind: '$paymentMethod' },
      { $sort: { total: -1 } },
    ]);
  }

  async getTopExpenses(userId, startDate, endDate, limit = 5) {
    return Expense.find({
      userId,
      isDeleted: false,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('categoryId', 'name icon color')
      .sort({ amount: -1 })
      .limit(limit);
  }

  async getSpentByCategory(userId, categoryId, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const result = await Expense.aggregate([
      {
        $match: {
          userId: userId,
          categoryId: categoryId,
          isDeleted: false,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total || 0;
  }

  async countForExport(userId, filters = {}) {
    return Expense.countDocuments({ userId, isDeleted: false, ...filters });
  }

  async findForExport(userId, filters = {}) {
    return Expense.find({ userId, isDeleted: false, ...filters })
      .populate('categoryId', 'name')
      .populate('paymentMethodId', 'name')
      .sort({ date: -1 });
  }
}

export default new ExpenseRepository();
