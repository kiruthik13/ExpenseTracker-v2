import express from 'express';
import ExpenseController from '../controllers/expense.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import { validate } from '../middleware/validation.js';
import { expenseValidator } from '../utils/validators.util.js';

const router = express.Router();

// All expense routes require authentication
router.use(protect);

router.get('/search', ExpenseController.search);
router.get('/export/csv', ExpenseController.exportCSV);
router.get('/export/pdf', ExpenseController.exportPDF);
router.get('/', ExpenseController.getAll);
router.get('/:id', ExpenseController.getById);
router.post('/', expenseValidator, validate, ExpenseController.create);
router.put('/:id', ExpenseController.update);
router.delete('/:id', ExpenseController.delete);
router.post('/:id/receipt', upload.single('receipt'), ExpenseController.uploadReceipt);

export default router;
