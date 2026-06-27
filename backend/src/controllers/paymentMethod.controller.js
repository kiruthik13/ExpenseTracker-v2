import PaymentMethodService from '../services/paymentMethod.service.js';
import { successResponse } from '../utils/response.util.js';

class PaymentMethodController {
  async getAll(req, res, next) {
    try {
      const methods = await PaymentMethodService.getAll(req.user._id);
      return successResponse(res, 'Payment methods retrieved', methods);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const method = await PaymentMethodService.getById(req.user._id, req.params.id);
      return successResponse(res, 'Payment method retrieved', method);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const method = await PaymentMethodService.create(req.user._id, req.body);
      return successResponse(res, 'Payment method created', method, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const method = await PaymentMethodService.update(req.user._id, req.params.id, req.body);
      return successResponse(res, 'Payment method updated', method);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await PaymentMethodService.delete(req.user._id, req.params.id);
      return successResponse(res, 'Payment method deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new PaymentMethodController();
