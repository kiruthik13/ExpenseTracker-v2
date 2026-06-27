import express from 'express';
import RecurringExpenseController from '../controllers/recurringExpense.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', RecurringExpenseController.getAll);
router.get('/:id', RecurringExpenseController.getById);
router.post('/', RecurringExpenseController.create);
router.put('/:id', RecurringExpenseController.update);
router.delete('/:id', RecurringExpenseController.delete);

export default router;
