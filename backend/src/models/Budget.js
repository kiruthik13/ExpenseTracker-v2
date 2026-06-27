import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100,
  },
  budgetAmount: {
    type: Number,
    required: true,
    min: [1, 'Budget must be at least 1'],
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  remainingAmount: {
    type: Number,
    default: function () {
      return this.budgetAmount;
    },
  },
  alertThreshold: {
    type: Number,
    default: 80, // percentage (alert at 80% spent)
    min: 1,
    max: 100,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Virtual for spent percentage
budgetSchema.virtual('spentPercentage').get(function () {
  if (this.budgetAmount === 0) return 0;
  return Math.min(Math.round((this.spentAmount / this.budgetAmount) * 100), 100);
});

budgetSchema.set('toJSON', { virtuals: true });
budgetSchema.set('toObject', { virtuals: true });

// Unique constraint: one budget per user per category per month/year
budgetSchema.index({ userId: 1, categoryId: 1, month: 1, year: 1 }, { unique: true });
budgetSchema.index({ userId: 1, month: 1, year: 1 });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;
