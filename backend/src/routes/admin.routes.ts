import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.post('/login', AdminController.login);
router.post('/forgot-password', AdminController.forgotPassword);
router.post('/reset-password', AdminController.resetPassword);
router.post('/change-password', AdminController.changePassword);
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSettings);
router.get('/books/:email', AdminController.downloadBook);

// Backups
router.post('/backups', AdminController.createBackup);
router.get('/backups', AdminController.listBackups);
router.post('/backups/restore', AdminController.restoreBackup);
router.get('/orders', AdminController.getOrders);

// Asaas Environment Switch
router.post('/asaas-env', AdminController.switchAsaasEnv);
router.get('/asaas-env', AdminController.getAsaasStatus);

router.delete('/wipe-user/:email', AdminController.wipeUserHistory);
router.delete('/wipe-all', AdminController.wipeAllHistory);

export default router;
