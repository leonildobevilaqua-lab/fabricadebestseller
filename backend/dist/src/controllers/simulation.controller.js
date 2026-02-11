"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateWebhook = void 0;
const uuid_1 = require("uuid");
const db_service_1 = require("../services/db.service");
const simulateWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        yield (0, db_service_1.reloadDB)(); // Force sync with disk to ensure we have latest data
        const { plan, billing, user } = req.body;
        if (!user || !user.email) {
            return res.status(400).json({ error: "User data required" });
        }
        const safeEmail = user.email.toLowerCase().trim().replace(/\./g, '_');
        // 1. Create/Update User Record with PENDING Plan
        yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, {
            name: plan,
            billing: billing,
            status: 'PENDING', // Waiting admin approval
            startDate: new Date(),
            simulated: true,
            paymentData: {
                payer: user.name,
                cpf: user.cpf,
                cardLast4: user.cardLast4
            }
        });
        // 2. Update the Lead Status if it exists, or Create if missing
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        // Find specific lead or latest
        let leadIndex = -1;
        // Search backwards to match current flow
        for (let i = leads.length - 1; i >= 0; i--) {
            if (((_a = leads[i].email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === user.email.toLowerCase().trim()) {
                leadIndex = i;
                break;
            }
        }
        if (leadIndex !== -1) {
            // Update the lead to reflect the PENDING plan
            yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/plan`, {
                name: plan,
                billing,
                status: 'PENDING'
            });
            yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'SUBSCRIBER_PENDING');
            // Ensure Payment Info is stored for visibility
            yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/paymentData`, {
                payer: user.name,
                method: 'SIMULATED'
            });
            console.log(`[SIMULATION] Existing Lead ${leadIndex} Updated for ${user.email}`);
        }
        else {
            console.log(`[SIMULATION] Creating NEW Lead for ${user.email}`);
            // Create a fresh lead for the simulation
            const newLead = {
                id: (0, uuid_1.v4)(),
                email: user.email,
                name: user.name || 'Simulado',
                phone: user.phone || '',
                fullPhone: user.phone || '', // redundancy
                type: 'SUBSCRIPTION', // It's a sub simulation
                status: 'SUBSCRIBER_PENDING',
                date: new Date(),
                created_at: new Date(),
                plan: {
                    name: plan,
                    billing,
                    status: 'PENDING',
                    simulated: true
                },
                paymentInfo: {
                    payer: user.name,
                    method: 'SIMULATED_WEBHOOK',
                    date: new Date()
                }
            };
            yield (0, db_service_1.pushVal)('/leads', newLead);
            console.log(`[SIMULATION] New Lead Created: ${newLead.id}`);
        }
        res.json({ success: true, message: "Subscription Simulation Queued" });
    }
    catch (e) {
        console.error("Simulation Error:", e);
        res.status(500).json({ error: e.message });
    }
});
exports.simulateWebhook = simulateWebhook;
