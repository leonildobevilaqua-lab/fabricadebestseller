import { Router } from 'express';
import { handleKiwifyWebhook, checkAccess, useCredit, createLead, getLeads, approveLead, updateLead, deleteLead, createCharge, createBookGenerationCharge, createSubscriptionCharge, createBookChargeLink } from '../controllers/payment.controller';
import { simulateWebhook } from '../controllers/simulation.controller';

const router = Router();

router.post('/webhook', handleKiwifyWebhook);
router.post('/simulate-webhook', simulateWebhook); // NEW: Local Simulation
router.get('/access', checkAccess);
router.get('/check-access', checkAccess);
router.get('/check-status', require('../controllers/payment.controller').checkPaymentStatus);
router.post('/use', useCredit);
router.post('/create-charge', createCharge);

// ASAAS GET REDIRECTS (Friendly Links)
router.get('/subscribe', createSubscriptionCharge);
router.get('/pay-book', createBookChargeLink);

// SPECIFIC ROUTE FOR BOOK GENERATION PURCHASE (POST/JSON)
router.post('/purchase/book-generation', createBookGenerationCharge);

// Admin / Leads
router.post('/leads', createLead);
router.get('/leads', getLeads);
router.post('/leads/view', getLeads); // Backup if needed, but get /leads is fine
router.put('/leads', updateLead);
router.delete('/leads/:id', deleteLead);
router.post('/leads/approve', approveLead);
router.get('/config', require('../controllers/payment.controller').getPublicConfig);

export default router;
