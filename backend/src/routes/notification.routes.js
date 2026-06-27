import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', NotificationController.getAll);
router.get('/unread', NotificationController.getUnread);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);
router.delete('/:id', NotificationController.delete);

export default router;
