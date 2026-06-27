import CategoryService from '../services/category.service.js';
import { successResponse } from '../utils/response.util.js';

class CategoryController {
  async getAll(req, res, next) {
    try {
      const categories = await CategoryService.getAll(req.user._id);
      return successResponse(res, 'Categories retrieved', categories);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await CategoryService.getById(req.user._id, req.params.id);
      return successResponse(res, 'Category retrieved', category);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const category = await CategoryService.create(req.user._id, req.body);
      return successResponse(res, 'Category created', category, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await CategoryService.update(req.user._id, req.params.id, req.body);
      return successResponse(res, 'Category updated', category);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await CategoryService.delete(req.user._id, req.params.id);
      return successResponse(res, 'Category deleted', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
