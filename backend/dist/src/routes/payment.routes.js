"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const simulation_controller_1 = require("../controllers/simulation.controller");
const router = (0, express_1.Router)();
router.post('/webhook', payment_controller_1.handleKiwifyWebhook);
router.post('/simulate-webhook', simulation_controller_1.simulateWebhook); // NEW: Local Simulation
router.get('/access', payment_controller_1.checkAccess);
router.post('/use', payment_controller_1.useCredit);
// Admin / Leads
router.post('/leads', payment_controller_1.createLead);
router.get('/leads', payment_controller_1.getLeads);
router.post('/leads/view', payment_controller_1.getLeads); // Backup if needed, but get /leads is fine
router.put('/leads', payment_controller_1.updateLead);
router.delete('/leads/:id', payment_controller_1.deleteLead);
router.post('/leads/approve', payment_controller_1.approveLead);
router.get('/config', require('../controllers/payment.controller').getPublicConfig);
exports.default = router;
