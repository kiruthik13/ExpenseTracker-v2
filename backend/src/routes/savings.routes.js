import express from 'express';
import SavingsGoalController from '../controllers/savings.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', SavingsGoalController.getAll);
router.get('/:id', SavingsGoalController.getById);
router.post('/', SavingsGoalController.create);
router.put('/:id', SavingsGoalController.update);
router.delete('/:id', SavingsGoalController.delete);

export default router;
