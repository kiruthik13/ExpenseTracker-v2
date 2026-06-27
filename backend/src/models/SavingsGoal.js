import mongoose from 'mongoose';

const savingsGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  targetAmount: {
    type: Number,
    required: true,
    min: [0.01, 'Target amount must be positive'],
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'failed'],
    default: 'active',
  },
}, {
  timestamps: true,
});

const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
export default SavingsGoal;
