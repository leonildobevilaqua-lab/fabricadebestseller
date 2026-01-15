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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLead = exports.updateLead = exports.getPublicConfig = exports.useCredit = exports.checkAccess = exports.handleKiwifyWebhook = exports.approveLead = exports.getLeads = exports.createLead = void 0;
const db_service_1 = require("../services/db.service");
const queue_service_1 = require("../services/queue.service");
// ... (rest of imports or code)
// ...
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
            status: 'PENDING',
            date: new Date(),
            topic,
            authorName,
            tag,
            plan,
            discount
        };
        yield (0, db_service_1.pushVal)('/leads', lead);
        res.json({ success: true });
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
        yield require('../services/db.service').reloadDB(); // Ensure fresh data
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
            yield (0, db_service_1.setVal)(`/leads[${targetIndex}]/status`, newStatus);
        }
    }
    catch (e) {
        console.error("Error updating lead status:", e);
    }
});
// Approve a lead (Grant free access OR Activate Plan)
const approveLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log("Approve Lead Request Body:", req.body);
        const { email } = req.body;
        if (!email) {
            console.error("Missing email in approveLead");
            return res.status(400).json({ error: "Email is required" });
        }
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        // Check if the latest lead is a PLAN lead
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        let targetLead = null;
        let pIndex = -1;
        for (let i = leads.length - 1; i >= 0; i--) {
            if (((_a = leads[i].email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim()) {
                targetLead = leads[i];
                pIndex = i;
                break;
            }
        }
        if (targetLead && targetLead.plan && targetLead.plan.name) {
            // IT IS A PLAN LEAD -> ACTIVATE PLAN
            console.log(`Manually Approving Plan ${targetLead.plan.name} for ${email}`);
            yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, {
                name: targetLead.plan.name,
                billing: targetLead.plan.billing,
                status: 'ACTIVE',
                startDate: new Date(),
                lastPayment: new Date()
            });
            yield (0, db_service_1.setVal)(`/leads[${pIndex}]/status`, 'SUBSCRIBER');
            res.json({ success: true, message: "Plan Activated Manually" });
        }
        else {
            // IT IS A BOOK LEAD -> GRANT CREDIT
            const val = yield (0, db_service_1.getVal)(`/credits/${safeEmail}`);
            const currentCredits = Number(val || 0);
            console.log(`Granting credit to ${safeEmail}. Current: ${currentCredits}, New: ${currentCredits + 1}`);
            yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, currentCredits + 1);
            // Update Lead Status
            yield updateLeadStatus(email, 'APPROVED');
            res.json({ success: true, newCredits: currentCredits + 1 });
        }
    }
    catch (e) {
        console.error("Error approving lead:", e);
        res.status(500).json({ error: "Error approving: " + e.message });
    }
});
exports.approveLead = approveLead;
// ... existing handler methods ...
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
                // If lead doesn't exist, create proper one? 
                // Usually lead exists from "Create Account" step or wizard.
                // If not, we might need to handle "floating" subscription. 
                // For now assuming lead matches or we update the generic 'credits'
                // Update specific user metadata for PLAN
                yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, {
                    name: detectedPlan,
                    billing,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    lastPayment: new Date()
                });
                if (leadIndex !== -1) {
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/plan`, { name: detectedPlan, billing });
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'SUBSCRIBER');
                }
                // DO NOT ADD CREDITS for Subscription itself (unless it comes with 1 free book? User didn't say).
                // User said: "Para ele gerar o primeiro livro... o valor deve ser X". So no free credits, just access + price.
            }
            else {
                // IT IS A BOOK PURCHASE (Credit)
                /*
                   Check if it is a "Book Generation" product.
                   If product name allows, we grant credit.
                   For now, retain old logic: Grant 1 Credit.
                */
                const currentCredits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
                yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, currentCredits + 1);
                if (leadIndex !== -1) {
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'APPROVED');
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/isVoucher`, true);
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
// --- PRICING CONFIGURATION ---
// Maps Plan -> Billing -> Level (1-based) -> { price, link }
const PRICING_CONFIG = {
    'STARTER': {
        'annual': [
            { price: 24.90, link: 'https://pay.kiwify.com.br/SpCDp2q' }, // Level 1 (Base)
            { price: 22.41, link: 'https://pay.kiwify.com.br/0R6K3gC' }, // Level 2 (10% off)
            { price: 21.17, link: 'https://pay.kiwify.com.br/2HYq1Ji' }, // Level 3 (15% off)
            { price: 19.92, link: 'https://pay.kiwify.com.br/KZSbSjM' } // Level 4 (20% off)
        ],
        'monthly': [
            { price: 26.90, link: 'https://pay.kiwify.com.br/g1L85dO' },
            { price: 24.21, link: 'https://pay.kiwify.com.br/iztHm1K' },
            { price: 22.87, link: 'https://pay.kiwify.com.br/tdpPzXY' },
            { price: 21.52, link: 'https://pay.kiwify.com.br/Up1n5lb' }
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
    const userPlan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
    // --- Dynamic Pricing Logic ---
    let bookPrice = 39.90; // Default Avulso
    let checkoutUrl = 'https://pay.kiwify.com.br/QPTslcx'; // Default Checkout
    let planName = 'NONE';
    let discountLevel = 1;
    // Count Completed/Approved leads for this user to determine Level
    let usageCount = 0;
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        usageCount = leads.filter((l) => {
            var _a;
            return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim() &&
                (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE');
        }).length;
    }
    catch (e) {
        console.error("Error counting user usage", e);
    }
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
    let leadStatus = null;
    let hasActiveProject = false;
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        for (let i = leads.length - 1; i >= 0; i--) {
            if (((_b = leads[i].email) === null || _b === void 0 ? void 0 : _b.toLowerCase().trim()) === email.toLowerCase().trim()) {
                leadStatus = leads[i].status;
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
            // Remove from array and save full array
            leads.splice(targetIndex, 1);
            yield (0, db_service_1.setVal)('/leads', leads);
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
