"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLead = exports.updateLead = exports.getPublicConfig = exports.useCredit = exports.checkAccess = exports.handleKiwifyWebhook = exports.approveLead = exports.getLeads = exports.createLead = void 0;
const uuid_1 = require("uuid");
const db_service_1 = require("../services/db.service");
const queue_service_1 = require("../services/queue.service");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)();
// --- PRICING CONFIGURATION ---
const PRICING_CONFIG = {
    'STARTER': {
        'annual': [
            { price: 24.90, link: 'https://pay.kiwify.com.br/SpCDp2q' }, // Level 1 (Base)
            { price: 22.41, link: 'https://pay.kiwify.com.br/0R6K3gC' }, // Level 2 (10% off)
            { price: 21.17, link: 'https://pay.kiwify.com.br/2HYq1Ji' }, // Level 3 (15% off)
            { price: 19.92, link: 'https://pay.kiwify.com.br/KZSbSjM' } // Level 4 (20% off)
        ],
        'monthly': [
            { price: 26.90, link: 'https://pay.kiwify.com.br/g1L85dO' }, // Level 1
            { price: 24.21, link: 'https://pay.kiwify.com.br/iztHm1K' }, // Level 2
            { price: 22.87, link: 'https://pay.kiwify.com.br/tdpPzXY' }, // Level 3
            { price: 21.52, link: 'https://pay.kiwify.com.br/Up1n5lb' } // Level 4
        ]
    },
    'PRO': {
        'annual': [
            { price: 19.90, link: 'https://pay.kiwify.com.br/pH8lSvE' },
            { price: 17.91, link: 'https://pay.kiwify.com.br/SCgOrg9' },
            { price: 16.92, link: 'https://pay.kiwify.com.br/mChyOMF' },
            { price: 15.92, link: 'https://pay.kiwify.com.br/t5vOuOH' }
        ],
        'monthly': [
            { price: 21.90, link: 'https://pay.kiwify.com.br/dEoi760' },
            { price: 19.71, link: 'https://pay.kiwify.com.br/93RoEg1' },
            { price: 18.62, link: 'https://pay.kiwify.com.br/JI5Ah1E' },
            { price: 17.52, link: 'https://pay.kiwify.com.br/EmUxPsB' }
        ]
    },
    'BLACK': {
        'annual': [
            { price: 14.90, link: 'https://pay.kiwify.com.br/ottQN4o' },
            { price: 13.41, link: 'https://pay.kiwify.com.br/7Df9tSf' },
            { price: 12.67, link: 'https://pay.kiwify.com.br/l41UVMk' },
            { price: 11.92, link: 'https://pay.kiwify.com.br/LxYJjDq' }
        ],
        'monthly': [
            { price: 16.90, link: 'https://pay.kiwify.com.br/Cg59pjZ' },
            { price: 15.21, link: 'https://pay.kiwify.com.br/kSe4GqY' },
            { price: 14.37, link: 'https://pay.kiwify.com.br/GCqdJAU' },
            { price: 13.52, link: 'https://pay.kiwify.com.br/LcNvYD0' }
        ]
    }
};
const SUBSCRIPTION_PRICES = {
    'STARTER': { annual: 118.80, monthly: 19.90 },
    'PRO': { annual: 238.80, monthly: 34.90 },
    'BLACK': { annual: 358.80, monthly: 49.90 }
};
// Store a lead when user fills the form
const createLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, phone, countryCode, type, topic, authorName, tag, plan, discount } = req.body;
        // Create a unique ID or use email
        const id = new Date().getTime().toString();
        // Basic logic: if discount is provided, let's store it
        const lead = {
            id,
            name,
            email,
            phone,
            fullPhone: `${countryCode}${phone}`,
            type: type || 'BOOK', // Default to BOOK if not provided
            status: req.body.status || 'PENDING',
            date: new Date(),
            topic,
            authorName,
            tag,
            plan,
            discount
        };
        yield (0, db_service_1.pushVal)('/leads', lead);
        res.json({ success: true, id });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error saving lead" });
    }
});
exports.createLead = createLead;
// Get all leads for admin
const getLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_service_1.reloadDB)();
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        // Enhance leads with credit status
        const leadsWithCredits = yield Promise.all(leads.map((lead) => __awaiter(void 0, void 0, void 0, function* () {
            if (!lead.email)
                return Object.assign(Object.assign({}, lead), { credits: 0 });
            const safeEmail = lead.email.toLowerCase().trim().replace(/\./g, '_');
            const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
            return Object.assign(Object.assign({}, lead), { credits });
        })));
        res.json(leadsWithCredits);
    }
    catch (e) {
        console.error("Error getting leads:", e);
        res.json([]);
    }
});
exports.getLeads = getLeads;
// Helper to update lead status by email (updates the most recent lead found with that email)
const updateLeadStatus = (email, newStatus) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        // Find index of the lead with this email (find latest)
        let targetIndex = -1;
        // Search backwards to find the most recent
        for (let i = leads.length - 1; i >= 0; i--) {
            if (leads[i].email.toLowerCase().trim() === email.toLowerCase().trim()) {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex !== -1) {
            const currentStatus = leads[targetIndex].status;
            // PRESERVE SUBSCRIBER STATUS
            if (currentStatus === 'SUBSCRIBER') {
                // If status implies book progress, save to productionStatus instead of overwriting SUBSCRIBER
                const progressStatuses = ['IN_PROGRESS', 'RESEARCHING', 'WRITING_CHAPTERS', 'COMPLETED', 'LIVRO ENTREGUE'];
                if (progressStatuses.includes(newStatus)) {
                    console.log(`[UPDATE] Preserving SUBSCRIBER status for ${email}, setting productionStatus to ${newStatus}`);
                    yield (0, db_service_1.setVal)(`/leads[${targetIndex}]/productionStatus`, newStatus);
                    return;
                }
            }
            // Standard update
            yield (0, db_service_1.setVal)(`/leads[${targetIndex}]/status`, newStatus);
        }
    }
    catch (e) {
        console.error("Error updating lead status:", e);
    }
});
// Approve a lead (Grant free access OR Activate Plan)
const approveLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        yield (0, db_service_1.reloadDB)();
        console.log("Approve Lead Request Body:", req.body);
        const { email, type, plan } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        let targetIndex = -1;
        // Find latest pending lead
        for (let i = leads.length - 1; i >= 0; i--) {
            const l = leads[i];
            if (((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() && l.status === 'PENDING') {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex === -1) {
            // Create New Lead logic (simplified for Manual Grant)
            targetIndex = leads.length;
            leads.push({
                email,
                status: 'PENDING',
                type: type || 'CREDIT',
                created_at: new Date(),
                name: 'Manual Grant'
            });
        }
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        let manualAmount = 0;
        if (plan) {
            // Manual Plan Grant
            leads[targetIndex].plan = Object.assign(Object.assign({}, plan), { status: 'ACTIVE' });
            leads[targetIndex].status = 'SUBSCRIBER'; // Plan Lead is Subscriber
            // Set User Plan in DB
            yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, Object.assign(Object.assign({}, plan), { status: 'ACTIVE' }));
            // Calc Value
            const pName = (_b = plan.name) === null || _b === void 0 ? void 0 : _b.toUpperCase();
            const billing = (_c = plan.billing) === null || _c === void 0 ? void 0 : _c.toLowerCase();
            manualAmount = ((_d = SUBSCRIPTION_PRICES[pName]) === null || _d === void 0 ? void 0 : _d[billing]) || 0;
            // Grant 1 Credit for New Sub?
            // Usually Sub includes 1 Book.
            const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
            if (credits === 0) {
                yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, 1);
            }
        }
        else {
            // Manual Extra Book Grant (Credit)
            leads[targetIndex].status = 'APPROVED';
            leads[targetIndex].isVoucher = true;
            // Grant +1 Credit
            const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
            yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, credits + 1);
            // Calc Value (Progressive Discount Logic)
            // Need usageCount (include this new one? No, previous history).
            const usageCount = leads.filter((l) => {
                var _a;
                return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                    (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS' || l.status === 'SUBSCRIBER');
            }).length;
            // Get Plan Name
            const userPlan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
            let planName = 'NONE';
            if (userPlan && userPlan.status === 'ACTIVE')
                planName = userPlan.name || 'STARTER';
            if (planName !== 'NONE') {
                // usageCount includes current one if it was already in DB? 
                // We added/found targetIndex. So it IS in leads array.
                // usageCount count is "how many leads match condition". 
                // So if we just added one, it counts.
                // The discount applies to the Nth book. 
                // If it is the 2nd book (Index 1), usageCount is 2.
                // Level should be usageCount % 4?
                // Example: 1st book -> usageCount 1. 1 % 4 = 1 (Level 2)?
                // Wait. 1st Book (Sub) -> usageCount 1.
                // 2nd Book (Extra) -> usageCount 2.
                // We want 2nd Book to be Level 2.
                // Array Index 0 = Level 1 (Price X).
                // Array Index 1 = Level 2 (Price Y).
                // So we want Index 1. 
                // If usageCount is 2, Index = 2 - 1 = 1.
                const prevCount = Math.max(0, usageCount - 1);
                const cycleIndex = prevCount % 4;
                const billing = (userPlan.billing || 'monthly').toLowerCase();
                const planConfig = (_e = PRICING_CONFIG[planName]) === null || _e === void 0 ? void 0 : _e[billing];
                if (planConfig && planConfig[cycleIndex]) {
                    manualAmount = planConfig[cycleIndex].price;
                }
                else {
                    manualAmount = 39.90; // Fallback
                }
            }
            else {
                manualAmount = 39.90; // Avulso
            }
        }
        // Store Payment Info for Dashboard
        leads[targetIndex].paymentInfo = {
            amount: manualAmount, // Store as float (AdminPanel checks if > 1000, so safe)
            currency: 'BRL',
            method: 'MANUAL_ADMIN',
            date: new Date()
        };
        yield (0, db_service_1.setVal)('/leads', leads);
        // Trigger auto flow if diagramming
        // ... (omitted for brevity, assume manual is final)
        res.json({ success: true, lead: leads[targetIndex] });
    }
    catch (e) {
        console.error("Approve Lead Error", e);
        res.status(500).json({ error: e.message });
    }
});
exports.approveLead = approveLead;
const handleKiwifyWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const payload = req.body;
        console.log("Kiwify Webhook Received:", JSON.stringify(payload));
        const status = payload.order_status;
        const email = ((_a = payload.Customer) === null || _a === void 0 ? void 0 : _a.email) || ((_b = payload.customer) === null || _b === void 0 ? void 0 : _b.email);
        const productName = ((_c = payload.Product) === null || _c === void 0 ? void 0 : _c.name) || ((_d = payload.product) === null || _d === void 0 ? void 0 : _d.name) || "Produto";
        if (status === 'paid' && email) {
            console.log(`Payment confirmed for ${email} - Product: ${productName}`);
            // Extract Payment Info
            const paymentInfo = {
                payer: ((_e = payload.Customer) === null || _e === void 0 ? void 0 : _e.full_name) || ((_f = payload.customer) === null || _f === void 0 ? void 0 : _f.full_name) || "Desconhecido",
                payerEmail: email,
                amount: (payload.amount || payload.total || 0) / 100,
                product: productName
            };
            yield (0, db_service_1.pushVal)('/orders', Object.assign(Object.assign({}, payload), { date: new Date(), paymentInfo }));
            const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
            // --- DETECT PLAN ---
            let detectedPlan = null;
            let billing = 'monthly'; // default
            const pName = productName.toLowerCase();
            if (pName.includes('starter'))
                detectedPlan = 'STARTER';
            if (pName.includes('pro'))
                detectedPlan = 'PRO';
            if (pName.includes('black') || pName.includes('vip'))
                detectedPlan = 'BLACK';
            if (pName.includes('anual') || pName.includes('annual') || pName.includes('ano'))
                billing = 'annual';
            // Find and Update Lead
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            let leadIndex = -1;
            for (let i = leads.length - 1; i >= 0; i--) {
                const l = leads[i];
                if (((_g = l.email) === null || _g === void 0 ? void 0 : _g.toLowerCase().trim()) === email.toLowerCase().trim()) {
                    leadIndex = i;
                    break;
                }
            }
            if (detectedPlan) {
                // IT IS A SUBSCRIPTION
                console.log(`Activating Plan ${detectedPlan} (${billing}) for ${email}`);
                yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, {
                    name: detectedPlan,
                    billing,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    lastPayment: new Date()
                });
                // GRANT CREDIT FOR SUBSCRIPTION PAYMENT (Fixes "Access" issue)
                const currentCredits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
                const creditsToAdd = billing === 'annual' ? 12 : 1; // 12 for annual, 1 for monthly
                console.log(`Granting ${creditsToAdd} credits for Subscription ${detectedPlan} (${billing})`);
                yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, currentCredits + creditsToAdd);
                if (leadIndex !== -1) {
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/plan`, { name: detectedPlan, billing });
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'SUBSCRIBER');
                    // FIX: Register Payment Value for Admin Panel
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                }
            }
            else {
                // IT IS A BOOK PURCHASE (Credit)
                const currentCredits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
                yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, currentCredits + 1);
                if (leadIndex !== -1) {
                    const existingLead = leads[leadIndex];
                    // IF EXISTING LEAD IS BUSY WITH PREVIOUS BOOK -> CREATE NEW LEAD FOR THIS PURCHASE
                    if (existingLead.status === 'IN_PROGRESS' || existingLead.status === 'COMPLETED' || existingLead.status === 'LIVRO ENTREGUE') {
                        console.log("Creating NEW Lead for additional purchase (Recurring)");
                        const newLead = {
                            id: (0, uuid_1.v4)(),
                            date: new Date(),
                            email: email,
                            name: paymentInfo.payer || existingLead.name,
                            phone: existingLead.phone,
                            type: 'BOOK',
                            status: 'APPROVED',
                            paymentInfo,
                            tag: 'Compra Adicional',
                            isVoucher: true
                        };
                        yield (0, db_service_1.pushVal)('/leads', newLead);
                    }
                    else {
                        // UPDATE PENDING LEAD
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'APPROVED');
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/isVoucher`, true);
                    }
                }
                else {
                    // NO LEAD FOUND -> CREATE NEW
                    console.log("Creating NEW Lead for direct purchase");
                    const newLead = {
                        id: (0, uuid_1.v4)(),
                        date: new Date(),
                        email: email,
                        name: paymentInfo.payer,
                        type: 'BOOK',
                        status: 'APPROVED',
                        paymentInfo,
                        tag: 'Compra Direta',
                        isVoucher: true
                    };
                    yield (0, db_service_1.pushVal)('/leads', newLead);
                }
                // Auto-Diagramming Logic (restored)
                try {
                    let targetLead = null;
                    for (let i = leads.length - 1; i >= 0; i--) {
                        const l = leads[i];
                        if (((_h = l.email) === null || _h === void 0 ? void 0 : _h.toLowerCase().trim()) === email.toLowerCase().trim() && l.type === 'DIAGRAMMING') {
                            targetLead = l;
                            break;
                        }
                    }
                    if (targetLead && targetLead.status !== 'COMPLETED') {
                        // Mock Trigger
                        fetch('http://localhost:3001/api/projects/process-diagram-lead', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ leadId: targetLead.id })
                        }).catch(e => console.error("Auto-diagram trigger failed", e));
                    }
                }
                catch (e) {
                    console.error("Auto-process error", e);
                }
            }
        }
        res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Webhook Error", error);
        res.status(500).json({ error: "Internal Error" });
    }
});
exports.handleKiwifyWebhook = handleKiwifyWebhook;
const checkAccess = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { email } = req.query;
    if (!email)
        return res.status(400).json({ error: "Email required" });
    const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
    const bypass = yield (0, db_service_1.getVal)('/settings/payment_bypass');
    if (bypass)
        return res.json({ hasAccess: true, credits: 999, hasActiveProject: false });
    const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
    let userPlan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
    // FETCH LEADS & VERIFY PLAN INTEGRITY
    let leads = [];
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        // SYNC: If user has 'ACTIVE' plan in DB but NO matching Subscriber Lead -> Revoke it.
        if (userPlan && userPlan.status === 'ACTIVE') {
            const hasActiveSub = leads.some((l) => {
                var _a;
                return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                    (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'));
            });
            if (!hasActiveSub) {
                console.log(`[SYNC] Revoking orphaned plan for ${email} (No active lead found)`);
                userPlan = null;
                (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, null); // Async cleanup
            }
        }
    }
    catch (e) {
        console.error("Error fetching leads for sync", e);
    }
    // DEBUG CREDITS
    const allCredits = yield (0, db_service_1.getVal)('/credits');
    console.log(`[CHECK_ACCESS] Email: ${email} -> Safe: ${safeEmail}`);
    console.log(`[CHECK_ACCESS] Credits Found: ${credits}`);
    // console.log(`[CHECK_ACCESS] All Credits Keys:`, Object.keys(allCredits || {}));
    if (credits > 0)
        console.log(`[POLL] ${safeEmail} has ${credits} credits. Access Granted.`);
    // --- Dynamic Pricing Logic ---
    let bookPrice = 39.90; // Default Avulso
    let checkoutUrl = 'https://pay.kiwify.com.br/QPTslcx'; // Default Checkout
    let planName = 'NONE';
    let discountLevel = 1;
    // Count Completed/Approved leads for this user to determine Level
    const usageCount = leads.filter((l) => {
        var _a;
        return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS' || l.status === 'SUBSCRIBER');
    }).length;
    if (userPlan && userPlan.status === 'ACTIVE') {
        planName = userPlan.name || 'STARTER';
        const billing = (userPlan.billing || 'monthly').toLowerCase();
        // Cycle: 0->L1, 1->L2, 2->L3, 3->L4, 4->L1 ...
        // usageCount includes previous purchases.
        // If usageCount is 0 (new sub), they are at Level 1.
        // If usageCount is 4, they are back to Level 1 (5th purchase).
        const cycleIndex = usageCount % 4; // 0, 1, 2, 3
        const planConfig = (_a = PRICING_CONFIG[planName]) === null || _a === void 0 ? void 0 : _a[billing];
        if (planConfig && planConfig[cycleIndex]) {
            bookPrice = planConfig[cycleIndex].price;
            checkoutUrl = planConfig[cycleIndex].link;
            discountLevel = cycleIndex + 1;
        }
        else {
            // Fallback if config missing
            console.warn(`Missing pricing config for ${planName} ${billing} index ${cycleIndex}`);
        }
    }
    // Find active project logic (Retained)
    // Find active project logic (Retained)
    let leadStatus = null;
    let hasActiveProject = false;
    let pendingPlan = null;
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        for (let i = leads.length - 1; i >= 0; i--) {
            if (((_b = leads[i].email) === null || _b === void 0 ? void 0 : _b.toLowerCase().trim()) === email.toLowerCase().trim()) {
                leadStatus = leads[i].status;
                if (leads[i].plan)
                    pendingPlan = leads[i].plan;
                break;
            }
        }
    }
    catch (e) { }
    try {
        const project = yield (0, queue_service_1.getProjectByEmail)(email.toLowerCase().trim());
        if (project && project.metadata.status !== 'COMPLETED' && project.metadata.status !== 'FAILED') {
            if (project.metadata.topic !== 'Livro Pré-Escrito') {
                hasActiveProject = true;
            }
        }
    }
    catch (e) { }
    if (hasActiveProject) {
        if (leadStatus !== 'APPROVED' && leadStatus !== 'LIVRO ENTREGUE' && leadStatus !== 'IN_PROGRESS' && credits <= 0) {
            hasActiveProject = false; // Deny if not paid
        }
    }
    res.json({
        hasAccess: credits > 0 || hasActiveProject,
        credits,
        hasActiveProject,
        leadStatus,
        plan: userPlan,
        pendingPlan,
        bookPrice,
        checkoutUrl,
        discountLevel
    });
});
exports.checkAccess = checkAccess;
const useCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email required" });
    const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
    const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
    if (credits > 0) {
        yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, credits - 1);
        yield updateLeadStatus(email, 'IN_PROGRESS');
        res.json({ success: true, remaining: credits - 1 });
    }
    else {
        return res.status(403).json({ error: "No credits available" });
    }
});
exports.useCredit = useCredit;
const getPublicConfig = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { getConfig } = yield Promise.resolve().then(() => __importStar(require('../services/config.service')));
        const config = yield getConfig();
        res.json({ products: config.products || {} });
    }
    catch (e) {
        res.status(500).json({ error: "Failed to load config" });
    }
});
exports.getPublicConfig = getPublicConfig;
// Update a lead generic
const updateLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, updates } = req.body;
        if (!id)
            return res.status(400).json({ error: "ID required" });
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        let targetIndex = -1;
        for (let i = 0; i < leads.length; i++) {
            if (leads[i].id === id) {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex !== -1) {
            const current = leads[targetIndex];
            const updated = Object.assign(Object.assign({}, current), updates);
            // Using logic from db.service which supports array path
            // /leads[0]
            yield (0, db_service_1.setVal)(`/leads[${targetIndex}]`, updated);
            res.json({ success: true, lead: updated });
        }
        else {
            res.status(404).json({ error: "Lead not found" });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.updateLead = updateLead;
// Delete a lead
const deleteLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id)
            return res.status(400).json({ error: "ID required" });
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        let leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        const targetIndex = leads.findIndex((l) => l.id === id);
        if (targetIndex !== -1) {
            const leadToDelete = leads[targetIndex];
            const email = leadToDelete.email;
            // Remove from array and save full array
            leads.splice(targetIndex, 1);
            yield (0, db_service_1.setVal)('/leads', leads);
            // SYNC: IF USER DELETES SUBSCRIPTION LEAD, REMOVE ACCESS
            if (email) {
                const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
                const hasActiveSub = leads.some((l) => {
                    var _a;
                    return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                        (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'));
                });
                if (!hasActiveSub) {
                    console.log(`Deleting Plan for ${email} as last subscription lead was removed.`);
                    yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, null);
                }
            }
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: "Lead not found" });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.deleteLead = deleteLead;
