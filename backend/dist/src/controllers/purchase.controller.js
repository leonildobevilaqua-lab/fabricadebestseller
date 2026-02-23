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
exports.createBookCharge = void 0;
const db_service_1 = require("../services/db.service");
const asaas_provider_1 = require("../services/asaas.provider");
// Pricing Config (Copied/Mirrored for consistency)
const PRICING_CONFIG = {
    'STARTER': {
        'annual': [24.90, 22.41, 21.17, 19.92],
        'monthly': [26.90, 24.21, 22.87, 21.52]
    },
    'PRO': {
        'annual': [19.90, 17.91, 16.92, 15.92],
        'monthly': [21.90, 19.71, 18.62, 17.52]
    },
    'BLACK': {
        'annual': [14.90, 13.41, 12.67, 11.92],
        'monthly': [16.90, 15.21, 14.37, 13.52]
    }
};
const createBookCharge = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: "Email required" });
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        yield (0, db_service_1.reloadDB)();
        // 1. Determine User Plan
        let plan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
        // Fallback to searching leads if no user plan
        if (!plan) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            const subLead = leads.find((l) => {
                var _a;
                return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                    l.status === 'SUBSCRIBER';
            });
            if (subLead && subLead.plan)
                plan = subLead.plan;
        }
        const planName = plan ? (plan.name || 'STARTER').toUpperCase() : 'STARTER';
        // Normalize Plan Name
        let finalPlanName = 'STARTER';
        if (planName.includes('BLACK'))
            finalPlanName = 'BLACK';
        else if (planName.includes('PRO'))
            finalPlanName = 'PRO';
        const billing = plan ? (plan.billing || 'monthly').toLowerCase() : 'monthly';
        // 2. Determine Cycle Level (Usage)
        // Count confirmed usage
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        const usageCount = leads.filter((l) => {
            var _a;
            return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS');
        }).length;
        const cycleIndex = usageCount % 4; // 0, 1, 2, 3
        // 3. Get Price
        const prices = ((_a = PRICING_CONFIG[finalPlanName]) === null || _a === void 0 ? void 0 : _a[billing]) || PRICING_CONFIG['STARTER']['monthly'];
        const price = prices[cycleIndex] || prices[0];
        // 4. Create Asaas Charge
        // Get/Create Customer
        const userProfile = (yield (0, db_service_1.getVal)(`/users/${safeEmail}/profile`)) || {};
        const customerId = yield asaas_provider_1.AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });
        // Create Payment
        const payment = yield asaas_provider_1.AsaasProvider.createPayment(customerId, price, `Geração de Livro - ${finalPlanName} - Ciclo ${cycleIndex + 1}/4`);
        console.log(`[PURCHASE] Created charge for ${email}: ${price} (${payment.invoiceUrl})`);
        return res.json({
            success: true,
            invoiceUrl: payment.invoiceUrl,
            price: price,
            level: cycleIndex + 1
        });
    }
    catch (e) {
        console.error("Purchase Error:", e);
        return res.status(500).json({ error: e.message || "Failed to create charge" });
    }
});
exports.createBookCharge = createBookCharge;
