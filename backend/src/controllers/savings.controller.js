import SavingsGoalService from '../services/savings.service.js';
import { successResponse } from '../utils/response.util.js';
import AuditLogRepository from '../repositories/AuditLog.repository.js';

class SavingsGoalController {
  async getAll(req, res, next) {
    try {
      const goals = await SavingsGoalService.getAll(req.user._id);
      return successResponse(res, 'Savings goals retrieved', goals);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const goal = await SavingsGoalService.getById(req.params.id, req.user._id);
      return successResponse(res, 'Savings goal retrieved', goal);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const goal = await SavingsGoalService.create(req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'CREATE_SAVINGS_GOAL', `Created goal: ${goal.title}`, req.ip);
      return successResponse(res, 'Savings goal created', goal, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const goal = await SavingsGoalService.update(req.params.id, req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'UPDATE_SAVINGS_GOAL', `Updated goal: ${goal.title}`, req.ip);
      return successResponse(res, 'Savings goal updated', goal);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await SavingsGoalService.delete(req.params.id, req.user._id);
      await AuditLogRepository.log(req.user._id, 'DELETE_SAVINGS_GOAL', `Deleted goal id: ${req.params.id}`, req.ip);
      return successResponse(res, 'Savings goal deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new SavingsGoalController();
