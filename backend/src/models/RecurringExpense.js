import mongoose from 'mongoose';

const recurringExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be positive'],
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 200,
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true,
  },
  nextExecutionDate: {
    type: Date,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const RecurringExpense = mongoose.model('RecurringExpense', recurringExpenseSchema);
export default RecurringExpense;
