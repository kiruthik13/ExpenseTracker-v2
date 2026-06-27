import express from 'express';
import PaymentMethodController from '../controllers/paymentMethod.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', PaymentMethodController.getAll);
router.get('/:id', PaymentMethodController.getById);
router.post('/', PaymentMethodController.create);
router.put('/:id', PaymentMethodController.update);
router.delete('/:id', PaymentMethodController.delete);

export default router;
