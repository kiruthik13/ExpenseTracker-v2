import express from 'express';
import BillReminderController from '../controllers/bill.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', BillReminderController.getAll);
router.get('/:id', BillReminderController.getById);
router.post('/', BillReminderController.create);
router.put('/:id', BillReminderController.update);
router.delete('/:id', BillReminderController.delete);

export default router;
