import PaymentMethod from '../models/PaymentMethod.js';

class PaymentMethodRepository {
  async create(data) {
    return PaymentMethod.create(data);
  }

  async findById(id, userId) {
    return PaymentMethod.findOne({ _id: id, userId, isDeleted: false });
  }

  async findByUserId(userId) {
    return PaymentMethod.find({ userId, isDeleted: false }).sort({ isDefault: -1, name: 1 });
  }

  async update(id, userId, updateData) {
    return PaymentMethod.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async softDelete(id, userId) {
    return PaymentMethod.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true },
      { new: true }
    );
  }

  async clearDefaults(userId) {
    return PaymentMethod.updateMany({ userId, isDeleted: false }, { isDefault: false });
  }

  async bulkCreate(methods) {
    return PaymentMethod.insertMany(methods);
  }
}

export default new PaymentMethodRepository();
