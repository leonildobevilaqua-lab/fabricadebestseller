
import { Router } from 'express';
import { UserAuthController } from '../controllers/user.auth.controller';
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
router.get('/me', authMiddleware, UserAuthController.me);

export default router;
