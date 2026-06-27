import express from 'express';
import AnalyticsController from '../controllers/analytics.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/summary', AnalyticsController.getSummary);
router.get('/monthly', AnalyticsController.getMonthly);
router.get('/category', AnalyticsController.getCategoryBreakdown);
router.get('/trends', AnalyticsController.getTrends);
router.get('/top-expenses', AnalyticsController.getTopExpenses);
router.get('/payment-methods', AnalyticsController.getPaymentMethodStats);

export default router;
