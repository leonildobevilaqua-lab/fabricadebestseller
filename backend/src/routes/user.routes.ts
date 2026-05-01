
import { Router } from 'express';
import { UserAuthController } from '../controllers/user.auth.controller';
import { LeadController } from '../controllers/lead.controller';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";

router.post('/login', UserAuthController.login);
router.post('/register', UserAuthController.register);
router.post('/forgot-password', UserAuthController.forgotPassword);
router.post('/reset-password', UserAuthController.resetPassword);
router.get('/me', authMiddleware, UserAuthController.me);
router.post('/update-password', authMiddleware, UserAuthController.updatePassword);

// LEAD SYSTEM
router.post('/leads', LeadController.registerLeads);

export default router;
