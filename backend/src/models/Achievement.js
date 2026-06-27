import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  badgeKey: {
    type: String,
    enum: ['first_expense', 'thirty_day_streak', 'saved_10000', 'budget_master', 'smart_saver', 'expense_champion'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  unlockedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Ensure unique achievements unlocked per user
achievementSchema.index({ userId: 1, badgeKey: 1 }, { unique: true });

const Achievement = mongoose.model('Achievement', achievementSchema);
export default Achievement;
