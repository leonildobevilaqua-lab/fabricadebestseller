import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.post('/login', AdminController.login);
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSettings);

export default router;
