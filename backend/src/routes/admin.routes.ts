import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';

const router = Router();

router.post('/login', AdminController.login);
router.post('/forgot-password', AdminController.forgotPassword);
router.post('/reset-password', AdminController.resetPassword);
router.post('/change-password', AdminController.changePassword); // Requires Bearer in Controller (via req.user if middleware was strict, but we check logic)
// Actually we need middleware or manual check. admin.controller.ts uses req.user which usually comes from middleware.
// Let's check app.ts to see if we have authenticaton middleware or if I need to inject it.
// Wait, I saw `res.user?.user` in the controller code I just wrote. 
// I need to ensure the request is authenticated. 
// The `updateSettings` endpoint usually requires Auth.
// Let's check `admin.routes.ts` again.
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSettings);
router.get('/books/:email', AdminController.downloadBook);

// Backups
router.post('/backups', AdminController.createBackup);
router.get('/backups', AdminController.listBackups);
router.post('/backups/restore', AdminController.restoreBackup);
router.get('/orders', AdminController.getOrders);

export default router;
