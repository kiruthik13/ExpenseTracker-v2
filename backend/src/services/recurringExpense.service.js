import RecurringExpenseRepository from '../repositories/RecurringExpense.repository.js';

class RecurringExpenseService {
  async create(userId, data) {
    return RecurringExpenseRepository.create({ ...data, userId });
  }

  async getAll(userId) {
    return RecurringExpenseRepository.findByUserId(userId);
  }

  async getById(id, userId) {
    return RecurringExpenseRepository.findById(id, userId);
  }

  async update(id, userId, data) {
    return RecurringExpenseRepository.update(id, userId, data);
  }

  async delete(id, userId) {
    return RecurringExpenseRepository.delete(id, userId);
  }
}

export default new RecurringExpenseService();
