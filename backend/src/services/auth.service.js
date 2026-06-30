import UserRepository from '../repositories/User.repository.js';
import { hashPassword, comparePassword } from '../utils/encryption.util.js';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.util.js';
import AppError from '../exceptions/AppError.js';
import User from '../models/User.js';
import { seedDefaultCategories } from '../seeds/category.seed.js';
import { seedDefaultPaymentMethods } from '../seeds/paymentMethod.seed.js';
import crypto from 'crypto';

class AuthService {
  async register({ email, password, fullName, currency = 'INR', timezone = 'UTC' }) {
    // Check if email already exists
    const existingEmail = await UserRepository.findByEmail(email);
    if (existingEmail) {
      throw new AppError('Email is already registered', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Determine role (first user is admin)
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    // Create user
    const newUser = await UserRepository.create({
      email,
      password: hashedPassword,
      fullName,
      currency,
      timezone,
      role,
      isActive: true,
    });

    // Seed default categories and payment methods for this user
    await seedDefaultCategories(newUser._id);
    await seedDefaultPaymentMethods(newUser._id);

    // Generate tokens
    const tokenPayload = { id: newUser._id, role: newUser.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await User.findByIdAndUpdate(newUser._id, { refreshToken });

    const userResponse = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      currency: newUser.currency,
      timezone: newUser.timezone,
      role: newUser.role,
      profilePicture: newUser.profilePicture,
      preferences: newUser.preferences,
    };

    return { user: userResponse, accessToken, refreshToken };
  }

  async login({ email, password }) {
    // Find user by email (include password for comparison)
    const user = await UserRepository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const tokenPayload = { id: user._id, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      currency: user.currency,
      timezone: user.timezone,
      role: user.role,
      monthlyIncome: user.monthlyIncome,
      profilePicture: user.profilePicture,
      preferences: user.preferences,
    };

    return { user: userResponse, accessToken, refreshToken };
  }

  async refresh(token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id);

      if (!user || user.refreshToken !== token || !user.isActive) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      const accessToken = generateToken({ id: user._id, role: user.role });
      return { accessToken };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
    return true;
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      refreshToken: null, // Invalidate all sessions
    });

    return true;
  }

  async forgotPassword(email) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists — just return success
      return true;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetTokenExpires,
    });

    // In production, send email with reset link
    // For now, return token in response (development only)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/reset-password.html?token=${resetToken}`;

    return { resetUrl, resetToken };
  }

  async resetPassword(token, newPassword) {
    const user = await UserRepository.findByResetToken(token);
    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const hashedPassword = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      refreshToken: null,
    });

    return true;
  }
}

export default new AuthService();
