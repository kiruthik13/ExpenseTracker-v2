import AuthService from '../services/auth.service.js';
import { successResponse } from '../utils/response.util.js';
import AppError from '../exceptions/AppError.js';

class AuthController {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return successResponse(res, 'Registration successful', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      return successResponse(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token is required', 400);
      const result = await AuthService.refresh(refreshToken);
      return successResponse(res, 'Token refreshed', result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.user._id);
      return successResponse(res, 'Logged out successfully', null);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      await AuthService.changePassword(req.user._id, req.body);
      return successResponse(res, 'Password changed successfully', null);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) throw new AppError('Email is required', 400);
      const result = await AuthService.forgotPassword(email);
      return successResponse(res, 'If that email exists, a reset link was sent', {
        // Only expose reset token in development
        ...(process.env.NODE_ENV === 'development' && result),
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      if (!token || !newPassword) throw new AppError('Token and new password are required', 400);
      await AuthService.resetPassword(token, newPassword);
      return successResponse(res, 'Password reset successfully', null);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
