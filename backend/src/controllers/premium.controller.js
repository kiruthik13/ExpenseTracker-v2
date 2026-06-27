import PremiumService from '../services/premium.service.js';
import { successResponse } from '../utils/response.util.js';
import AuditLogRepository from '../repositories/AuditLog.repository.js';

class PremiumController {
  async getDashboardInfo(req, res, next) {
    try {
      const userId = req.user._id;

      // Fetch all info in parallel
      const [healthScore, prediction, insights, recommendations] = await Promise.all([
        PremiumService.getFinancialHealthScore(userId),
        PremiumService.getExpensePrediction(userId),
        PremiumService.getAISpendingInsights(userId),
        PremiumService.getSmartBudgetRecommendation(userId),
      ]);

      // Audit log view
      await AuditLogRepository.log(userId, 'VIEW_PREMIUM_DASHBOARD', 'Dashboard analytics requested', req.ip);

      return successResponse(res, 'Premium analytical data compiled successfully', {
        healthScore,
        prediction,
        insights,
        recommendations
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PremiumController();
