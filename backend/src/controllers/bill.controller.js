import BillReminderService from '../services/bill.service.js';
import { successResponse } from '../utils/response.util.js';
import AuditLogRepository from '../repositories/AuditLog.repository.js';

class BillReminderController {
  async getAll(req, res, next) {
    try {
      const bills = await BillReminderService.getAll(req.user._id);
      return successResponse(res, 'Bill reminders retrieved', bills);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const bill = await BillReminderService.getById(req.params.id, req.user._id);
      return successResponse(res, 'Bill reminder retrieved', bill);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const bill = await BillReminderService.create(req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'CREATE_BILL_REMINDER', `Created bill reminder: ${bill.title}`, req.ip);
      return successResponse(res, 'Bill reminder created', bill, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const bill = await BillReminderService.update(req.params.id, req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'UPDATE_BILL_REMINDER', `Updated bill reminder: ${bill.title}`, req.ip);
      return successResponse(res, 'Bill reminder updated', bill);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await BillReminderService.delete(req.params.id, req.user._id);
      await AuditLogRepository.log(req.user._id, 'DELETE_BILL_REMINDER', `Deleted bill reminder id: ${req.params.id}`, req.ip);
      return successResponse(res, 'Bill reminder deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new BillReminderController();
