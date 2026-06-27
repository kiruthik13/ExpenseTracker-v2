import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerValidator,
  loginValidator,
  changePasswordValidator,
} from '../utils/validators.util.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 */
router.post('/register', authLimiter, registerValidator, validate, AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     tags: [Authentication]
 *     security: []
 */
router.post('/login', authLimiter, loginValidator, validate, AuthController.login);

router.post('/refresh', AuthController.refresh);
router.post('/logout', protect, AuthController.logout);
router.post('/change-password', protect, changePasswordValidator, validate, AuthController.changePassword);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
