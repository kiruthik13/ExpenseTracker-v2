import RecurringExpense from '../models/RecurringExpense.js';

class RecurringExpenseRepository {
  async create(data) {
    return RecurringExpense.create(data);
  }

  async findById(id, userId) {
    return RecurringExpense.findOne({ _id: id, userId }).populate('categoryId', 'name icon color');
  }

  async findByUserId(userId) {
    return RecurringExpense.find({ userId }).populate('categoryId', 'name icon color');
  }

  async findActive() {
    return RecurringExpense.find({ isActive: true });
  }

  async findDue(date = new Date()) {
    return RecurringExpense.find({
      isActive: true,
      nextExecutionDate: { $lte: date }
    }).populate('categoryId');
  }

  async update(id, userId, updateData) {
    return RecurringExpense.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    ).populate('categoryId', 'name icon color');
  }

  async delete(id, userId) {
    return RecurringExpense.findOneAndDelete({ _id: id, userId });
  }
}

export default new RecurringExpenseRepository();
