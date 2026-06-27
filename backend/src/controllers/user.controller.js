import UserService from '../services/user.service.js';
import { successResponse } from '../utils/response.util.js';
import AppError from '../exceptions/AppError.js';

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await UserService.getProfile(req.user._id);
      return successResponse(res, 'Profile retrieved', user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const user = await UserService.updateProfile(req.user._id, req.body);
      return successResponse(res, 'Profile updated', user);
    } catch (error) {
      next(error);
    }
  }

  async uploadProfilePicture(req, res, next) {
    try {
      if (!req.file) throw new AppError('No file uploaded', 400);
      const user = await UserService.uploadProfilePicture(req.user._id, req.file);
      return successResponse(res, 'Profile picture updated', user);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
