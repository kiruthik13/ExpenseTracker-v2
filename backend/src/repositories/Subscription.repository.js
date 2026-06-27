import Subscription from '../models/Subscription.js';

class SubscriptionRepository {
  async create(data) {
    return Subscription.create(data);
  }

  async findById(id, userId) {
    return Subscription.findOne({ _id: id, userId });
  }

  async findByUserId(userId) {
    return Subscription.find({ userId }).sort({ nextBillingDate: 1 });
  }

  async findActiveByUserId(userId) {
    return Subscription.find({ userId, isActive: true }).sort({ nextBillingDate: 1 });
  }

  async findUpcoming(upcomingDateThreshold) {
    // Find active subscriptions whose nextBillingDate is on or before the threshold
    return Subscription.find({
      isActive: true,
      nextBillingDate: { $lte: upcomingDateThreshold }
    }).populate('userId');
  }

  async update(id, userId, updateData) {
    return Subscription.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async delete(id, userId) {
    return Subscription.findOneAndDelete({ _id: id, userId });
  }
}

export default new SubscriptionRepository();
