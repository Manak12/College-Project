import express from 'express';
import { signup, login, logout, changePassword } from '../controller/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', protect, logout);
router.post('/change-password', protect, changePassword);

export default router;