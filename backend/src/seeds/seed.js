import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import Models
import User from '../models/User.js';
import Category from '../models/Category.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Expense from '../models/Expense.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import Subscription from '../models/Subscription.js';
import BillReminder from '../models/BillReminder.js';
import Notification from '../models/Notification.js';
import Achievement from '../models/Achievement.js';

const seedData = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined in your .env file!');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGO_URI);
  console.log('Database connected!');

  const email = 'demo@example.com';

  // 1. Clean existing records for the demo user
  console.log(`Cleaning old data for ${email}...`);
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const userId = existingUser._id;
    await Promise.all([
      Expense.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Category.deleteMany({ userId }),
      PaymentMethod.deleteMany({ userId }),
      SavingsGoal.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      BillReminder.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      Achievement.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);
  }

  // 2. Create Demo User
  console.log('Creating demo user...');
  const hashedPassword = await bcrypt.hash('password123', 12);
  const user = await User.create({
    fullName: 'Kiruthik C',
    email,
    password: hashedPassword,
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    monthlyIncome: 65000,
    streakCount: 5,
    lastActiveDate: new Date(),
  });
  const userId = user._id;

  // 3. Create Categories
  console.log('Seeding categories...');
  const categoriesData = [
    { name: 'Food & Dining', icon: 'fa-utensils', color: '#f59e0b', type: 'expense', budgetLimit: 8000 },
    { name: 'Transportation', icon: 'fa-car', color: '#3b82f6', type: 'expense', budgetLimit: 4000 },
    { name: 'Shopping', icon: 'fa-shopping-bag', color: '#ec4899', type: 'expense', budgetLimit: 6000 },
    { name: 'Entertainment', icon: 'fa-film', color: '#8b5cf6', type: 'expense', budgetLimit: 3000 },
    { name: 'Healthcare', icon: 'fa-heartbeat', color: '#ef4444', type: 'expense', budgetLimit: 2000 },
    { name: 'Bills & Utilities', icon: 'fa-file-invoice', color: '#6b7280', type: 'expense', budgetLimit: 15000 },
    { name: 'Education', icon: 'fa-graduation-cap', color: '#06b6d4', type: 'expense', budgetLimit: 0 },
    { name: 'Travel', icon: 'fa-plane', color: '#10b981', type: 'expense', budgetLimit: 10000 },
    { name: 'Savings Transfer', icon: 'fa-piggy-bank', color: '#14b8a6', type: 'expense', budgetLimit: 0 },
    { name: 'Salary', icon: 'fa-briefcase', color: '#22c55e', type: 'income', budgetLimit: 0 },
    { name: 'Freelance', icon: 'fa-laptop', color: '#a855f7', type: 'income', budgetLimit: 0 },
    { name: 'Investment', icon: 'fa-chart-line', color: '#f97316', type: 'income', budgetLimit: 0 },
    { name: 'Other Income', icon: 'fa-plus-circle', color: '#84cc16', type: 'income', budgetLimit: 0 },
    { name: 'Other Expense', icon: 'fa-tag', color: '#94a3b8', type: 'expense', budgetLimit: 0 },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await Category.create({ userId, ...cat, isDefault: true });
    categories[cat.name] = created._id;
  }

  // 4. Create Payment Methods
  console.log('Seeding payment methods...');
  const paymentMethodsData = [
    { name: 'HDFC Bank Account', type: 'bank_transfer', isDefault: true },
    { name: 'Cash', type: 'cash' },
    { name: 'GPay UPI', type: 'upi' },
    { name: 'ICICI Amazon Pay Credit Card', type: 'credit_card' },
  ];

  const paymentMethods = {};
  for (const pm of paymentMethodsData) {
    const created = await PaymentMethod.create({ userId, ...pm });
    paymentMethods[pm.name] = created._id;
  }

  // 5. Create Budgets (for current month & year)
  console.log('Seeding budgets...');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Budgets: Food & Dining: 8000, Shopping: 6000, Bills: 15000, Entertainment: 3000
  const budgetLimits = [
    { categoryName: 'Food & Dining', amount: 8000, spent: 6500 },
    { categoryName: 'Shopping', amount: 6000, spent: 10500 }, // Over-budget shopping!
    { categoryName: 'Bills & Utilities', amount: 15000, spent: 13500 },
    { categoryName: 'Entertainment', amount: 3000, spent: 2500 },
  ];

  for (const b of budgetLimits) {
    await Budget.create({
      userId,
      categoryId: categories[b.categoryName],
      month: currentMonth,
      year: currentYear,
      budgetAmount: b.amount,
      spentAmount: b.spent,
      remainingAmount: b.amount - b.spent,
    });
  }

  // 6. Create Transactions (Expenses & Incomes)
  console.log('Seeding expenses and incomes...');
  const currentMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthStart = new Date(lastMonthYear, lastMonth - 1, 1);

  const txns = [
    // Current Month Incomes
    { amount: 65000, type: 'income', categoryName: 'Salary', paymentMethodName: 'HDFC Bank Account', date: new Date(currentMonthStart.getTime() + 1 * 24 * 3600 * 1000), description: 'Monthly Corporate Salary' },
    { amount: 15000, type: 'income', categoryName: 'Freelance', paymentMethodName: 'GPay UPI', date: new Date(currentMonthStart.getTime() + 15 * 24 * 3600 * 1000), description: 'UI Design Freelance Project' },

    // Last Month Incomes
    { amount: 65000, type: 'income', categoryName: 'Salary', paymentMethodName: 'HDFC Bank Account', date: new Date(lastMonthStart.getTime() + 1 * 24 * 3600 * 1000), description: 'Monthly Corporate Salary' },

    // Current Month Expenses
    { amount: 12000, type: 'expense', categoryName: 'Bills & Utilities', paymentMethodName: 'HDFC Bank Account', date: new Date(currentMonthStart.getTime() + 2 * 24 * 3600 * 1000), description: 'House Rent' },
    { amount: 1500, type: 'expense', categoryName: 'Bills & Utilities', paymentMethodName: 'ICICI Amazon Pay Credit Card', date: new Date(currentMonthStart.getTime() + 5 * 24 * 3600 * 1000), description: 'Electricity Bill Payment' },
    { amount: 2500, type: 'expense', categoryName: 'Food & Dining', paymentMethodName: 'ICICI Amazon Pay Credit Card', date: new Date(currentMonthStart.getTime() + 6 * 24 * 3600 * 1000), description: 'Dinner at Barbeque Nation' },
    { amount: 1200, type: 'expense', categoryName: 'Food & Dining', paymentMethodName: 'GPay UPI', date: new Date(currentMonthStart.getTime() + 10 * 24 * 3600 * 1000), description: 'Office lunch & snacks' },
    { amount: 2800, type: 'expense', categoryName: 'Food & Dining', paymentMethodName: 'Cash', date: new Date(currentMonthStart.getTime() + 18 * 24 * 3600 * 1000), description: 'Weekly groceries' },
    
    // Shopping Spike in Current Month (₹10,500 vs ₹2,500 in Last Month)
    { amount: 7500, type: 'expense', categoryName: 'Shopping', paymentMethodName: 'ICICI Amazon Pay Credit Card', date: new Date(currentMonthStart.getTime() + 12 * 24 * 3600 * 1000), description: 'New Leather Jacket & Shoes' },
    { amount: 3000, type: 'expense', categoryName: 'Shopping', paymentMethodName: 'GPay UPI', date: new Date(currentMonthStart.getTime() + 22 * 24 * 3600 * 1000), description: 'Summer wardrobe clothes' },

    { amount: 2500, type: 'expense', categoryName: 'Entertainment', paymentMethodName: 'GPay UPI', date: new Date(currentMonthStart.getTime() + 8 * 24 * 3600 * 1000), description: 'Movie night + Popcorn' },
    { amount: 1200, type: 'expense', categoryName: 'Transportation', paymentMethodName: 'GPay UPI', date: new Date(currentMonthStart.getTime() + 4 * 24 * 3600 * 1000), description: 'Fuel fillup' },
    { amount: 800, type: 'expense', categoryName: 'Transportation', paymentMethodName: 'Cash', date: new Date(currentMonthStart.getTime() + 14 * 24 * 3600 * 1000), description: 'Auto & Cab rides' },

    // Last Month Expenses
    { amount: 12000, type: 'expense', categoryName: 'Bills & Utilities', paymentMethodName: 'HDFC Bank Account', date: new Date(lastMonthStart.getTime() + 2 * 24 * 3600 * 1000), description: 'House Rent' },
    { amount: 2500, type: 'expense', categoryName: 'Shopping', paymentMethodName: 'GPay UPI', date: new Date(lastMonthStart.getTime() + 15 * 24 * 3600 * 1000), description: 'Basic shirts' },
    { amount: 3000, type: 'expense', categoryName: 'Food & Dining', paymentMethodName: 'Cash', date: new Date(lastMonthStart.getTime() + 12 * 24 * 3600 * 1000), description: 'Groceries' },
    { amount: 1500, type: 'expense', categoryName: 'Food & Dining', paymentMethodName: 'GPay UPI', date: new Date(lastMonthStart.getTime() + 20 * 24 * 3600 * 1000), description: 'Fast food orders' },
  ];

  for (const t of txns) {
    await Expense.create({
      userId,
      amount: t.amount,
      type: t.type,
      categoryId: categories[t.categoryName],
      paymentMethodId: paymentMethods[t.paymentMethodName],
      date: t.date,
      description: t.description,
    });
  }

  // 7. Create Savings Goals
  console.log('Seeding savings goals...');
  await SavingsGoal.create({
    userId,
    title: 'Emergency Fund',
    targetAmount: 50000,
    currentAmount: 50000,
    deadline: new Date(currentYear, currentMonth, 15),
    status: 'completed',
  });

  await SavingsGoal.create({
    userId,
    title: 'New Macbook Pro M3',
    targetAmount: 150000,
    currentAmount: 35000,
    deadline: new Date(currentYear + 1, 0, 1),
    status: 'active',
  });

  // 8. Create Subscriptions
  console.log('Seeding subscriptions...');
  await Subscription.create({
    userId,
    name: 'Netflix India Premium',
    amount: 649,
    billingCycle: 'monthly',
    nextBillingDate: new Date(now.getTime() + 4 * 24 * 3600 * 1000),
    isActive: true,
  });

  await Subscription.create({
    userId,
    name: 'Spotify Family Premium',
    amount: 179,
    billingCycle: 'monthly',
    nextBillingDate: new Date(now.getTime() + 8 * 24 * 3600 * 1000),
    isActive: true,
  });

  // 9. Create Bill Reminders
  console.log('Seeding bill reminders...');
  await BillReminder.create({
    userId,
    title: 'Act Fiber Broadband',
    amount: 999,
    dueDate: new Date(now.getTime() + 5 * 24 * 3600 * 1000),
    category: 'Bills & Utilities',
    isPaid: false,
  });

  await BillReminder.create({
    userId,
    title: 'HDFC Credit Card Bill',
    amount: 18500,
    dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
    category: 'Credit Cards',
    isPaid: true,
  });

  // 10. Create Notifications
  console.log('Seeding notifications...');
  await Notification.create({
    userId,
    type: 'budget_exceeded',
    title: 'Shopping Budget Exceeded! ⚠️',
    message: 'Your spending in "Shopping" has reached ₹10,500, exceeding your monthly budget limit of ₹6,000.',
    isRead: false,
  });

  await Notification.create({
    userId,
    type: 'goal_achieved',
    title: 'Savings Target Met! 🎉',
    message: 'Congratulations! You have successfully completed your "Emergency Fund" target of ₹50,000!',
    isRead: false,
  });

  // 11. Seed Achievements/Badges
  console.log('Seeding achievements...');
  await Achievement.create({
    userId,
    badgeKey: 'first_expense',
    title: 'First Step',
    description: 'Log your first expense transaction.',
    unlockedAt: new Date(lastMonthStart),
  });

  await Achievement.create({
    userId,
    badgeKey: 'smart_saver',
    title: 'Goal Getter',
    description: 'Successfully complete your first savings goal.',
    unlockedAt: new Date(),
  });

  console.log('\n=========================================');
  console.log('  SEEDING COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
  console.log('Demo Login Credentials:');
  console.log('  Email:    demo@example.com');
  console.log('  Password: password123');
  console.log('=========================================\n');

  await mongoose.disconnect();
  console.log('Database disconnected, seeding script exit.');
};

seedData().catch((err) => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
