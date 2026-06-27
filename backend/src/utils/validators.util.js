import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD'])
    .withMessage('Invalid currency'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
];

export const expenseValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be income or expense'),
  body('categoryId')
    .notEmpty()
    .withMessage('Category is required'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('recurringType')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurring type'),
];

export const budgetValidator = [
  body('categoryId').notEmpty().withMessage('Category is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  body('budgetAmount').isFloat({ min: 1 }).withMessage('Budget amount must be at least 1'),
];

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Invalid hex color'),
  body('type')
    .optional()
    .isIn(['income', 'expense', 'both'])
    .withMessage('Type must be income, expense, or both'),
];
