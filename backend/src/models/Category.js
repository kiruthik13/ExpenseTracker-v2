import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  icon: {
    type: String,
    default: 'fa-tag',
  },
  color: {
    type: String,
    default: '#8b5cf6',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'],
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'expense',
  },
  budgetLimit: {
    type: Number,
    default: 0,
    min: 0,
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

categorySchema.index({ userId: 1, isDeleted: 1 });

const Category = mongoose.model('Category', categorySchema);
export default Category;
