import SubscriptionRepository from '../repositories/Subscription.repository.js';

class SubscriptionService {
  async create(userId, data) {
    return SubscriptionRepository.create({ ...data, userId });
  }

  async getAll(userId) {
    return SubscriptionRepository.findByUserId(userId);
  }

  async getById(id, userId) {
    return SubscriptionRepository.findById(id, userId);
  }

  async update(id, userId, data) {
    return SubscriptionRepository.update(id, userId, data);
  }

  async delete(id, userId) {
    return SubscriptionRepository.delete(id, userId);
  }
}

export default new SubscriptionService();
