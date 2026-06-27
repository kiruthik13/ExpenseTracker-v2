import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: null,
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'],
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  monthlyIncome: {
    type: Number,
    default: 0,
    min: 0,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  refreshToken: {
    type: String,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    notifications: { type: Boolean, default: true },
    budgetAlerts: { type: Boolean, default: true },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  streakCount: {
    type: Number,
    default: 0,
  },
  lastActiveDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Note: email index is created automatically by unique:true in the schema definition above

const User = mongoose.model('User', userSchema);
export default User;
