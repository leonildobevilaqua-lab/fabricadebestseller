import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.post('/login', AdminController.login);
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSettings);
router.get('/books/:email', AdminController.downloadBook);

// Backups
router.post('/backups', AdminController.createBackup);
router.get('/backups', AdminController.listBackups);
router.post('/backups/restore', AdminController.restoreBackup);
router.get('/orders', AdminController.getOrders);

export default router;
