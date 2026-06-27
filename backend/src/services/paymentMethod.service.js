import PaymentMethodRepository from '../repositories/PaymentMethod.repository.js';
import AppError from '../exceptions/AppError.js';

class PaymentMethodService {
  async getAll(userId) {
    return PaymentMethodRepository.findByUserId(userId);
  }

  async getById(userId, id) {
    const pm = await PaymentMethodRepository.findById(id, userId);
    if (!pm) throw new AppError('Payment method not found', 404);
    return pm;
  }

  async create(userId, data) {
    const { type, name, isDefault = false } = data;

    // If setting as default, clear other defaults
    if (isDefault) {
      await PaymentMethodRepository.clearDefaults(userId);
    }

    return PaymentMethodRepository.create({ userId, type, name, isDefault });
  }

  async update(userId, id, data) {
    const pm = await PaymentMethodRepository.findById(id, userId);
    if (!pm) throw new AppError('Payment method not found', 404);

    if (data.isDefault) {
      await PaymentMethodRepository.clearDefaults(userId);
    }

    return PaymentMethodRepository.update(id, userId, data);
  }

  async delete(userId, id) {
    const pm = await PaymentMethodRepository.findById(id, userId);
    if (!pm) throw new AppError('Payment method not found', 404);

    await PaymentMethodRepository.softDelete(id, userId);
    return true;
  }
}

export default new PaymentMethodService();
