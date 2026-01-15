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
router.patch('/:id', ProjectController.update);
router.post('/:id/send-email', upload.single('file'), ProjectController.sendBookEmail);
router.post('/:id/generate-extras', ProjectController.generateExtras);
router.post('/upload-existing', upload.single('file'), ProjectController.uploadExistingBook);
router.post('/process-diagram-lead', ProjectController.processDiagramLead);
router.post('/:id/regenerate-docx', ProjectController.regenerateDocx);
router.post('/find-id-by-email', ProjectController.findIdByEmail);

export default router;
