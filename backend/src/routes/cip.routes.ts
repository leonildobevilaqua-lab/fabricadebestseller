import { Router } from 'express';
import { CipController } from '../controllers/cip.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

router.post('/generate', authMiddleware, upload.single('file'), CipController.generateCip);

export default router;
