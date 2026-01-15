import { Router } from 'express';
import { handleKiwifyWebhook, checkAccess, useCredit, createLead, getLeads, approveLead, updateLead, deleteLead } from '../controllers/payment.controller';
import { simulateWebhook } from '../controllers/simulation.controller';

const router = Router();

router.post('/webhook', handleKiwifyWebhook);
router.post('/simulate-webhook', simulateWebhook); // NEW: Local Simulation
router.get('/access', checkAccess);
router.post('/use', useCredit);

// Admin / Leads
router.post('/leads', createLead);
router.get('/leads', getLeads);
router.post('/leads/view', getLeads); // Backup if needed, but get /leads is fine
router.put('/leads', updateLead);
router.delete('/leads/:id', deleteLead);
router.post('/leads/approve', approveLead);
router.get('/config', require('../controllers/payment.controller').getPublicConfig);

export default router;
