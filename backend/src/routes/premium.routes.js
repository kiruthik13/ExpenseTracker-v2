import express from 'express';
import PremiumController from '../controllers/premium.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/dashboard', PremiumController.getDashboardInfo);

export default router;
