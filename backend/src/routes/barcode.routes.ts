
import { Router } from 'express';
import { BarcodeController } from '../controllers/barcode.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/generate', authMiddleware, BarcodeController.generateBarcode);

export default router;
