import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'upi', 'bank_transfer', 'wallet', 'other'],
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

paymentMethodSchema.index({ userId: 1, isDeleted: 1 });

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);
export default PaymentMethod;
