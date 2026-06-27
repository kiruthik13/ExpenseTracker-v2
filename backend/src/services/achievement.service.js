import AchievementRepository from '../repositories/Achievement.repository.js';
import NotificationRepository from '../repositories/Notification.repository.js';

const BADGE_DEFS = {
  first_expense: {
    title: 'First Step',
    description: 'Log your first expense transaction.'
  },
  thirty_day_streak: {
    title: 'Loyal Logger',
    description: 'Maintain a 30-day logging streak.'
  },
  saved_10000: {
    title: 'Wealth Builder',
    description: 'Accumulate $10,000 in savings goals.'
  },
  budget_master: {
    title: 'Disciplined Spender',
    description: 'Keep all monthly budgets under limits.'
  },
  smart_saver: {
    title: 'Goal Getter',
    description: 'Successfully complete your first savings goal.'
  },
  expense_champion: {
    title: 'Expense Champion',
    description: 'Log a total of 100 financial transactions.'
  }
};

class AchievementService {
  async getByUserId(userId) {
    return AchievementRepository.findByUserId(userId);
  }

  async checkAndUnlock(userId, badgeKey) {
    try {
      const existing = await AchievementRepository.findByUserAndKey(userId, badgeKey);
      if (existing) return null;

      const def = BADGE_DEFS[badgeKey];
      if (!def) return null;

      const newBadge = await AchievementRepository.create({
        userId,
        badgeKey,
        title: def.title,
        description: def.description
      });

      // Send smart notification
      await NotificationRepository.create({
        userId,
        type: 'goal_achieved',
        title: 'Achievement Unlocked! 🏆',
        message: `Congratulations! You've unlocked the "${def.title}" badge: ${def.description}`
      });

      return newBadge;
    } catch (err) {
      console.error(`Failed to unlock achievement ${badgeKey}:`, err.message);
      return null;
    }
  }
}

export default new AchievementService();
