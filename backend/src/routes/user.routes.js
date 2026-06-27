import express from 'express';
import UserController from '../controllers/user.controller.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);
router.post('/profile-picture', upload.single('avatar'), UserController.uploadProfilePicture);

export default router;
