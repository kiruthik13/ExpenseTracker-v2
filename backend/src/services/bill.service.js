import BillReminderRepository from '../repositories/BillReminder.repository.js';

class BillReminderService {
  async create(userId, data) {
    return BillReminderRepository.create({ ...data, userId });
  }

  async getAll(userId) {
    return BillReminderRepository.findByUserId(userId);
  }

  async getById(id, userId) {
    return BillReminderRepository.findById(id, userId);
  }

  async update(id, userId, data) {
    return BillReminderRepository.update(id, userId, data);
  }

  async delete(id, userId) {
    return BillReminderRepository.delete(id, userId);
  }
}

export default new BillReminderService();
