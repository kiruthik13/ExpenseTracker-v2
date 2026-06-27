import BudgetService from '../services/budget.service.js';
import { successResponse } from '../utils/response.util.js';

class BudgetController {
  async getAll(req, res, next) {
    try {
      const { month, year } = req.query;
      const budgets = await BudgetService.getAll(req.user._id, month, year);
      return successResponse(res, 'Budgets retrieved', budgets);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const budget = await BudgetService.getById(req.user._id, req.params.id);
      return successResponse(res, 'Budget retrieved', budget);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const budget = await BudgetService.create(req.user._id, req.body);
      return successResponse(res, 'Budget created', budget, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const budget = await BudgetService.update(req.user._id, req.params.id, req.body);
      return successResponse(res, 'Budget updated', budget);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await BudgetService.delete(req.user._id, req.params.id);
      return successResponse(res, 'Budget deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new BudgetController();
