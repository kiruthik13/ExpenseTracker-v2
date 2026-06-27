import UserRepository from '../repositories/User.repository.js';
import AppError from '../exceptions/AppError.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.util.js';
import User from '../models/User.js';
import AchievementService from './achievement.service.js';

class UserService {
  async getProfile(userId) {
    await this.updateActivityStreak(userId);
    const user = await UserRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  async updateProfile(userId, data) {
    const allowedFields = ['fullName', 'currency', 'timezone', 'monthlyIncome', 'preferences'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    const updated = await UserRepository.update(userId, updateData);
    if (!updated) throw new AppError('User not found', 404);
    return updated;
  }

  async uploadProfilePicture(userId, file) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    // Delete old picture if exists
    if (user.profilePicturePublicId) {
      await deleteFromCloudinary(user.profilePicturePublicId).catch(() => {});
    }

    let profilePicture = null;
    let publicId = null;

    try {
      const result = await uploadToCloudinary(file.buffer, {
        folder: 'expense-tracker/avatars',
        transformation: [{ width: 300, height: 300, crop: 'fill' }],
      });
      profilePicture = result.secure_url;
      publicId = result.public_id;
    } catch (err) {
      // Fallback: store as base64 or use a placeholder
      profilePicture = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { profilePicture, profilePicturePublicId: publicId },
      { new: true }
    ).select('-password -refreshToken');

    return updated;
  }

  async deleteAccount(userId) {
    await User.findByIdAndUpdate(userId, { isActive: false });
    return true;
  }

  async updateActivityStreak(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!user.lastActiveDate) {
      user.streakCount = 1;
      user.lastActiveDate = today;
      await user.save();
    } else {
      const lastActive = new Date(user.lastActiveDate);
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());

      const diffTime = Math.abs(today - lastActiveDay);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streakCount += 1;
        user.lastActiveDate = today;
        await user.save();

        if (user.streakCount === 30) {
          await AchievementService.checkAndUnlock(userId, 'thirty_day_streak');
        }
      } else if (diffDays > 1) {
        user.streakCount = 1;
        user.lastActiveDate = today;
        await user.save();
      }
    }
    return user.streakCount;
  }
}

export default new UserService();
