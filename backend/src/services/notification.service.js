import NotificationRepository from '../repositories/Notification.repository.js';
import SubscriptionRepository from '../repositories/Subscription.repository.js';
import BillReminderRepository from '../repositories/BillReminder.repository.js';

class NotificationService {
  async getUnread(userId) {
    return NotificationRepository.findUnreadByUserId(userId);
  }

  async getAll(userId, limit = 30) {
    return NotificationRepository.findByUserId(userId, limit);
  }

  async markAsRead(id, userId) {
    return NotificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    await NotificationRepository.markAllAsRead(userId);
    return { success: true };
  }

  async createNotification({ userId, type, title, message }) {
    return NotificationRepository.create({ userId, type, title, message });
  }

  async delete(id, userId) {
    return NotificationRepository.delete(id, userId);
  }

  async checkUpcomingReminders() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // 1. Check Subscriptions
    const upcomingSubs = await SubscriptionRepository.findUpcoming(threeDaysFromNow);
    for (const sub of upcomingSubs) {
      const uId = sub.userId._id || sub.userId;
      const unreads = await NotificationRepository.findUnreadByUserId(uId);
      const isNotified = unreads.some(n => n.type === 'subscription_renewal' && n.message.includes(sub.name));
      
      if (!isNotified) {
        await NotificationRepository.create({
          userId: uId,
          type: 'subscription_renewal',
          title: 'Subscription Renewal Alert 💳',
          message: `Your subscription for "${sub.name}" ($${sub.amount}) is renewing on ${new Date(sub.nextBillingDate).toLocaleDateString()}.`
        });
      }
    }

    // 2. Check Bills
    const upcomingBills = await BillReminderRepository.findUpcomingUnpaid(threeDaysFromNow);
    for (const bill of upcomingBills) {
      const uId = bill.userId._id || bill.userId;
      const unreads = await NotificationRepository.findUnreadByUserId(uId);
      const isNotified = unreads.some(n => n.type === 'bill_reminder' && n.message.includes(bill.title));

      if (!isNotified) {
        await NotificationRepository.create({
          userId: uId,
          type: 'bill_reminder',
          title: 'Bill Payment Alert ⏰',
          message: `Your bill "${bill.title}" ($${bill.amount}) is due on ${new Date(bill.dueDate).toLocaleDateString()}.`
        });
      }
    }
  }
}

export default new NotificationService();
