import express from 'express';
import BudgetController from '../controllers/budget.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', BudgetController.getAll);
router.get('/:id', BudgetController.getById);
router.post('/', BudgetController.create);
router.put('/:id', BudgetController.update);
router.delete('/:id', BudgetController.delete);

export default router;
