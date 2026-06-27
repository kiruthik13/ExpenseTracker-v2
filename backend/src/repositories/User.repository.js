import User from '../models/User.js';

class UserRepository {
  async findById(id) {
    return User.findById(id).select('-password');
  }

  async findByIdWithPassword(id) {
    return User.findById(id);
  }

  async findByEmail(email) {
    return User.findOne({ email: email.toLowerCase() });
  }

  async create(userData) {
    return User.create(userData);
  }

  async update(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password -refreshToken');
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;
    const docs = await User.find(filter).select('-password -refreshToken').skip(skip).limit(limit);
    const totalDocs = await User.countDocuments(filter);
    return {
      docs,
      totalDocs,
      totalPages: Math.ceil(totalDocs / limit),
      page,
      limit,
    };
  }

  async findByResetToken(token) {
    return User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
  }
}

export default new UserRepository();
