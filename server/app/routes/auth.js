import { Router } from 'express';
import { register, verifyOtp, resendOtp, login, logout, googleAuth } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleAuth);

export default router;
