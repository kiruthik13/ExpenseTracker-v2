import AchievementService from '../services/achievement.service.js';
import { successResponse } from '../utils/response.util.js';

class AchievementController {
  async getAll(req, res, next) {
    try {
      const badges = await AchievementService.getByUserId(req.user._id);
      return successResponse(res, 'Achievements retrieved', badges);
    } catch (error) {
      next(error);
    }
  }
}

export default new AchievementController();
