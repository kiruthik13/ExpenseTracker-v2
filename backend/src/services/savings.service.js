import SavingsGoalRepository from '../repositories/SavingsGoal.repository.js';
import AchievementService from './achievement.service.js';
import NotificationService from './notification.service.js';

class SavingsGoalService {
  async create(userId, data) {
    const goal = await SavingsGoalRepository.create({ ...data, userId });
    return goal;
  }

  async getAll(userId) {
    return SavingsGoalRepository.findByUserId(userId);
  }

  async getById(id, userId) {
    return SavingsGoalRepository.findById(id, userId);
  }

  async update(id, userId, data) {
    const existing = await SavingsGoalRepository.findById(id, userId);
    if (!existing) throw new Error('Savings goal not found');

    const updated = await SavingsGoalRepository.update(id, userId, data);

    // Check if goal just reached completion status
    if (updated.currentAmount >= updated.targetAmount && existing.currentAmount < existing.targetAmount) {
      await SavingsGoalRepository.update(id, userId, { status: 'completed' });
      updated.status = 'completed';

      // Send congratulations notification
      await NotificationService.createNotification({
        userId,
        type: 'goal_achieved',
        title: 'Savings Goal Achieved! 🎉',
        message: `Incredible job! You have fully funded your "${updated.title}" savings goal.`
      });

      // Gamification trigger
      await AchievementService.checkAndUnlock(userId, 'smart_saver');

      // Check sum of all completed goals for saved_10000 badge
      const allGoals = await SavingsGoalRepository.findByUserId(userId);
      const totalSaved = allGoals
        .filter(g => g.status === 'completed')
        .reduce((sum, g) => sum + g.targetAmount, 0);

      if (totalSaved >= 100000) {
        await AchievementService.checkAndUnlock(userId, 'saved_10000');
      }
    }

    return updated;
  }

  async delete(id, userId) {
    return SavingsGoalRepository.delete(id, userId);
  }
}

export default new SavingsGoalService();
