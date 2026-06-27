import express from 'express';
import CategoryController from '../controllers/category.controller.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);
router.post('/', CategoryController.create);
router.put('/:id', CategoryController.update);
router.delete('/:id', CategoryController.delete);

export default router;
