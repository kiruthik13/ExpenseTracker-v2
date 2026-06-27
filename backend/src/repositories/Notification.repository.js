import Notification from '../models/Notification.js';

class NotificationRepository {
  async create(data) {
    return Notification.create(data);
  }

  async findByUserId(userId, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  async findUnreadByUserId(userId) {
    return Notification.find({ userId, isRead: false }).sort({ createdAt: -1 });
  }

  async markAsRead(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return Notification.updateMany({ userId, isRead: false }, { isRead: true });
  }

  async delete(id, userId) {
    return Notification.findOneAndDelete({ _id: id, userId });
  }
}

export default new NotificationRepository();
