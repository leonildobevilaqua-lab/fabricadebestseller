
import { Router } from 'express';
import { UserAuthController } from '../controllers/user.auth.controller';
import { LeadController } from '../controllers/lead.controller';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";

// Middleware simples
const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, SECRET, (err: any, user: any) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

router.post('/login', UserAuthController.login);
router.post('/register', UserAuthController.register);
router.post('/forgot-password', UserAuthController.forgotPassword);
router.post('/reset-password', UserAuthController.resetPassword);
router.get('/me', authMiddleware, UserAuthController.me);
router.post('/update-password', authMiddleware, UserAuthController.updatePassword);

// LEAD SYSTEM
router.post('/leads', LeadController.registerLeads);

export default router;
