import RecurringExpenseService from '../services/recurringExpense.service.js';
import { successResponse } from '../utils/response.util.js';
import AuditLogRepository from '../repositories/AuditLog.repository.js';

class RecurringExpenseController {
  async getAll(req, res, next) {
    try {
      const recs = await RecurringExpenseService.getAll(req.user._id);
      return successResponse(res, 'Recurring expenses templates retrieved', recs);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const rec = await RecurringExpenseService.getById(req.params.id, req.user._id);
      return successResponse(res, 'Recurring expense template retrieved', rec);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const rec = await RecurringExpenseService.create(req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'CREATE_RECURRING_EXPENSE', `Created template: ${rec.description}`, req.ip);
      return successResponse(res, 'Recurring expense template created', rec, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const rec = await RecurringExpenseService.update(req.params.id, req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'UPDATE_RECURRING_EXPENSE', `Updated template: ${rec.description}`, req.ip);
      return successResponse(res, 'Recurring expense template updated', rec);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await RecurringExpenseService.delete(req.params.id, req.user._id);
      await AuditLogRepository.log(req.user._id, 'DELETE_RECURRING_EXPENSE', `Deleted template id: ${req.params.id}`, req.ip);
      return successResponse(res, 'Recurring expense template deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new RecurringExpenseController();
