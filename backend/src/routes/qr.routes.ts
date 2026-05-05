
import { Router } from 'express';
import { QrController } from '../controllers/qr.controller';

const router = Router();

// Route for generating QR Code - Requires authentication in production
// For now, matching barcode structure which takes email from body/user
router.post('/generate', QrController.generateQr);

export default router;
