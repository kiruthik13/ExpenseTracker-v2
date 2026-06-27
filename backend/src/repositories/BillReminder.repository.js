import BillReminder from '../models/BillReminder.js';

class BillReminderRepository {
  async create(data) {
    return BillReminder.create(data);
  }

  async findById(id, userId) {
    return BillReminder.findOne({ _id: id, userId });
  }

  async findByUserId(userId) {
    return BillReminder.find({ userId }).sort({ dueDate: 1 });
  }

  async findUnpaidByUserId(userId) {
    return BillReminder.find({ userId, status: 'unpaid' }).sort({ dueDate: 1 });
  }

  async findUpcomingUnpaid(upcomingDateThreshold) {
    return BillReminder.find({
      status: 'unpaid',
      dueDate: { $lte: upcomingDateThreshold }
    }).populate('userId');
  }

  async update(id, userId, updateData) {
    return BillReminder.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async delete(id, userId) {
    return BillReminder.findOneAndDelete({ _id: id, userId });
  }
}

export default new BillReminderRepository();
