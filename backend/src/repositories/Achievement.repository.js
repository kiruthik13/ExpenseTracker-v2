import Achievement from '../models/Achievement.js';

class AchievementRepository {
  async create(data) {
    return Achievement.create(data);
  }

  async findByUserId(userId) {
    return Achievement.find({ userId }).sort({ unlockedAt: -1 });
  }

  async findByUserAndKey(userId, badgeKey) {
    return Achievement.findOne({ userId, badgeKey });
  }
}

export default new AchievementRepository();
