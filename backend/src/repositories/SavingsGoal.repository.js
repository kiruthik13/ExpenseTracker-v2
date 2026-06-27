import SavingsGoal from '../models/SavingsGoal.js';

class SavingsGoalRepository {
  async create(data) {
    return SavingsGoal.create(data);
  }

  async findById(id, userId) {
    return SavingsGoal.findOne({ _id: id, userId });
  }

  async findByUserId(userId) {
    return SavingsGoal.find({ userId }).sort({ deadline: 1 });
  }

  async findActiveByUserId(userId) {
    return SavingsGoal.find({ userId, status: 'active' }).sort({ deadline: 1 });
  }

  async update(id, userId, updateData) {
    return SavingsGoal.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async delete(id, userId) {
    return SavingsGoal.findOneAndDelete({ _id: id, userId });
  }
}

export default new SavingsGoalRepository();
