import { Router } from 'express';
import * as ProjectController from '../controllers/project.controller';

const router = Router();

import multer from 'multer';

const upload = multer();

router.post('/', ProjectController.create);
router.get('/:id', ProjectController.get);
router.post('/:id/research', ProjectController.startResearch);
router.post('/:id/select-title', ProjectController.selectTitle);
router.post('/:id/generate', ProjectController.generateBookContent);
router.post('/:id/send-email', upload.single('file'), ProjectController.sendBookEmail);

export default router;
