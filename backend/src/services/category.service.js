import CategoryRepository from '../repositories/Category.repository.js';
import AppError from '../exceptions/AppError.js';

class CategoryService {
  async getAll(userId) {
    const categories = await CategoryRepository.findByUserId(userId);
    return categories;
  }

  async getById(userId, categoryId) {
    const category = await CategoryRepository.findById(categoryId, userId);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  }

  async create(userId, data) {
    const { name, icon = 'fa-tag', color = '#8b5cf6', type = 'expense', budgetLimit = 0 } = data;

    const category = await CategoryRepository.create({
      userId,
      name,
      icon,
      color,
      type,
      budgetLimit,
      isDefault: false,
    });

    return category;
  }

  async update(userId, categoryId, data) {
    const category = await CategoryRepository.findById(categoryId, userId);
    if (!category) throw new AppError('Category not found', 404);
    if (category.isDefault && data.name) {
      // Allow updating color/icon of defaults, but not name
    }

    const updated = await CategoryRepository.update(categoryId, userId, data);
    return updated;
  }

  async delete(userId, categoryId) {
    const category = await CategoryRepository.findById(categoryId, userId);
    if (!category) throw new AppError('Category not found', 404);
    if (category.isDefault) {
      throw new AppError('Cannot delete a default category', 400);
    }

    await CategoryRepository.softDelete(categoryId, userId);
    return true;
  }
}

export default new CategoryService();
