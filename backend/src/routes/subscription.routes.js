import express from 'express';
import SubscriptionController from '../controllers/subscription.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', SubscriptionController.getAll);
router.get('/:id', SubscriptionController.getById);
router.post('/', SubscriptionController.create);
router.put('/:id', SubscriptionController.update);
router.delete('/:id', SubscriptionController.delete);

export default router;
