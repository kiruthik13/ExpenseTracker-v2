import express from 'express';
import AchievementController from '../controllers/achievement.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', AchievementController.getAll);

export default router;
