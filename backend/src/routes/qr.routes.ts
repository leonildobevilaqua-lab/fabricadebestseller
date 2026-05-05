import { Router } from 'express';
import { QrController } from '../controllers/qr.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Route for generating QR Code - Requires authentication
router.post('/generate', authMiddleware, QrController.generateQr);

export default router;
