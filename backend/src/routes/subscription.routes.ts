import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';

const router = Router();

router.post('/create', SubscriptionController.create);
router.post('/change-plan', SubscriptionController.changePlan);
// router.post('/webhook', SubscriptionController.webhook); // Managed in app.ts

export default router;
