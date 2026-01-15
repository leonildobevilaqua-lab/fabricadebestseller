import { Router } from 'express';
import { handleKiwifyWebhook, checkAccess, useCredit, createLead, getLeads, approveLead } from '../controllers/payment.controller';

const router = Router();

router.post('/webhook', handleKiwifyWebhook);
router.get('/access', checkAccess);
router.post('/use', useCredit);

// Admin / Leads
router.post('/leads', createLead);
router.get('/leads', getLeads);
router.post('/leads/approve', approveLead);

export default router;
