import mongoose from 'mongoose';

const billReminderSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Bill amount must be positive'],
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  },
  category: {
    type: String,
    default: 'Utility',
  },
}, {
  timestamps: true,
});

const BillReminder = mongoose.model('BillReminder', billReminderSchema);
export default BillReminder;
