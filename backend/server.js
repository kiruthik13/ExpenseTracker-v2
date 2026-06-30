import './src/config/dotenv.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import cron from 'node-cron';

// Configs & Utils
import connectDB from './src/config/database.js';
import logger from './src/config/logger.js';
import swaggerSpec from './src/config/swagger.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import errorHandler from './src/middleware/errorHandler.js';

// Route imports
import authRoutes from './src/routes/auth.routes.js';
import expenseRoutes from './src/routes/expense.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import budgetRoutes from './src/routes/budget.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import userRoutes from './src/routes/user.routes.js';
import paymentMethodRoutes from './src/routes/paymentMethod.routes.js';
import premiumRoutes from './src/routes/premium.routes.js';
import savingsRoutes from './src/routes/savings.routes.js';
import subscriptionRoutes from './src/routes/subscription.routes.js';
import billRoutes from './src/routes/bill.routes.js';
import notificationRoutes from './src/routes/notification.routes.js';
import achievementRoutes from './src/routes/achievement.routes.js';
import recurringExpenseRoutes from './src/routes/recurringExpense.routes.js';

// Cron job for recurring expenses and reminders
import { processRecurringExpenses } from './src/services/expense.service.js';
import NotificationService from './src/services/notification.service.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security & HTTP request logs
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://expense-tracker-v2-rho.vercel.app'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS Policy: Access denied'), false);
  },
  credentials: true,
}));
app.use(morgan('combined', { stream: { write: (message) => logger.http(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply global rate limiting
app.use(globalLimiter);

// Serve static uploads (if local storage fallback)
app.use('/uploads', express.static('uploads'));

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/budgets', budgetRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payment-methods', paymentMethodRoutes);
app.use('/api/v1/premium', premiumRoutes);
app.use('/api/v1/savings-goals', savingsRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/bill-reminders', billRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/achievements', achievementRoutes);
app.use('/api/v1/recurring-expenses', recurringExpenseRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Expense Tracker API is active',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Centralized error handling
app.use(errorHandler);

// Establish database connection and start server
connectDB().then(async () => {
  app.listen(PORT, () => {
    logger.info(`Expense Tracker API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`API Documentation available at http://localhost:${PORT}/api/docs`);
  });
});

// Cron job: Process recurring expenses daily at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Running scheduled recurring expense processing and checks...');
  try {
    const processed = await processRecurringExpenses();
    logger.info(`Recurring expenses processed: ${processed} new expenses created.`);
    
    // Check reminders for bills & subscriptions
    await NotificationService.checkUpcomingReminders();
    logger.info('Upcoming renewals and bill reminders processed.');
  } catch (error) {
    logger.error(`Error during recurring expense cron job: ${error.message}`);
  }
});
