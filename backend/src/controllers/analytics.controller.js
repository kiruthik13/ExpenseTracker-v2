import AnalyticsService from '../services/analytics.service.js';
import { successResponse } from '../utils/response.util.js';

class AnalyticsController {
  async getSummary(req, res, next) {
    try {
      const { month, year } = req.query;
      const summary = await AnalyticsService.getSummary(req.user._id, month, year);
      return successResponse(res, 'Summary retrieved', summary);
    } catch (error) {
      next(error);
    }
  }

  async getMonthly(req, res, next) {
    try {
      const { year } = req.query;
      const data = await AnalyticsService.getMonthly(req.user._id, year);
      return successResponse(res, 'Monthly data retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  async getCategoryBreakdown(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AnalyticsService.getCategoryBreakdown(req.user._id, startDate, endDate);
      return successResponse(res, 'Category breakdown retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const { months = 6 } = req.query;
      const data = await AnalyticsService.getTrends(req.user._id, parseInt(months));
      return successResponse(res, 'Trends retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  async getTopExpenses(req, res, next) {
    try {
      const { limit = 5, startDate, endDate } = req.query;
      const data = await AnalyticsService.getTopExpenses(req.user._id, limit, startDate, endDate);
      return successResponse(res, 'Top expenses retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentMethodStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const data = await AnalyticsService.getPaymentMethodStats(req.user._id, startDate, endDate);
      return successResponse(res, 'Payment method stats retrieved', data);
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
