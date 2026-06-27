import Category from '../models/Category.js';

class CategoryRepository {
  async create(data) {
    return Category.create(data);
  }

  async findById(id, userId) {
    return Category.findOne({ _id: id, userId, isDeleted: false });
  }

  async findByUserId(userId) {
    return Category.find({ userId, isDeleted: false }).sort({ isDefault: -1, name: 1 });
  }

  async update(id, userId, updateData) {
    return Category.findOneAndUpdate(
      { _id: id, userId, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async softDelete(id, userId) {
    return Category.findOneAndUpdate(
      { _id: id, userId },
      { isDeleted: true },
      { new: true }
    );
  }

  async bulkCreate(categories) {
    return Category.insertMany(categories);
  }

  async countByUser(userId) {
    return Category.countDocuments({ userId, isDeleted: false });
  }

  async findDefaults(userId) {
    return Category.find({ userId, isDefault: true, isDeleted: false });
  }
}

export default new CategoryRepository();
