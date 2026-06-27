import SubscriptionService from '../services/subscription.service.js';
import { successResponse } from '../utils/response.util.js';
import AuditLogRepository from '../repositories/AuditLog.repository.js';

class SubscriptionController {
  async getAll(req, res, next) {
    try {
      const subs = await SubscriptionService.getAll(req.user._id);
      return successResponse(res, 'Subscriptions retrieved', subs);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const sub = await SubscriptionService.getById(req.params.id, req.user._id);
      return successResponse(res, 'Subscription retrieved', sub);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const sub = await SubscriptionService.create(req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'CREATE_SUBSCRIPTION', `Created subscription: ${sub.name}`, req.ip);
      return successResponse(res, 'Subscription created', sub, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const sub = await SubscriptionService.update(req.params.id, req.user._id, req.body);
      await AuditLogRepository.log(req.user._id, 'UPDATE_SUBSCRIPTION', `Updated subscription: ${sub.name}`, req.ip);
      return successResponse(res, 'Subscription updated', sub);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await SubscriptionService.delete(req.params.id, req.user._id);
      await AuditLogRepository.log(req.user._id, 'DELETE_SUBSCRIPTION', `Deleted subscription id: ${req.params.id}`, req.ip);
      return successResponse(res, 'Subscription deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new SubscriptionController();
