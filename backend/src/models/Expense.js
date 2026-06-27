import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0'],
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    default: 'expense',
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    default: null,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  receiptUrl: {
    type: String,
    default: null,
  },
  receiptPublicId: {
    type: String,
    default: null,
  },
  tags: {
    type: [String],
    default: [],
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', null],
    default: null,
  },
  nextRecurringDate: {
    type: Date,
    default: null,
  },
  parentExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense',
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    default: 'active',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient querying
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, categoryId: 1 });
expenseSchema.index({ userId: 1, isDeleted: 1, date: -1 });
expenseSchema.index({ isRecurring: 1, nextRecurringDate: 1 });

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
