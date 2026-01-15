import { Request, Response } from 'express';
import { setVal, getVal, pushVal } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';

// ... (rest of imports or code)

// ...
// Store a lead when user fills the form
export const createLead = async (req: Request, res: Response) => {
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
        await pushVal('/leads', lead);
        res.json({ success: true, id });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error saving lead" });
    }
};

// Get all leads for admin
export const getLeads = async (req: Request, res: Response) => {
    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Enhance leads with credit status
        const leadsWithCredits = await Promise.all(leads.map(async (lead: any) => {
            if (!lead.email) return { ...lead, credits: 0 };
            const safeEmail = lead.email.toLowerCase().trim().replace(/\./g, '_');
            const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
            return { ...lead, credits };
        }));

        res.json(leadsWithCredits);
    } catch (e) {
        console.error("Error getting leads:", e);
        res.json([]);
    }
};

// Helper to update lead status by email (updates the most recent lead found with that email)
const updateLeadStatus = async (email: string, newStatus: string) => {
    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Find index of the lead with this email (find latest)
        let targetIndex = -1;
        // Search backwards to find the most recent
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email.toLowerCase().trim() === email.toLowerCase().trim()) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1) {
            await setVal(`/leads[${targetIndex}]/status`, newStatus);
        }
    } catch (e) {
        console.error("Error updating lead status:", e);
    }
};

// Approve a lead (Grant free access OR Activate Plan)
export const approveLead = async (req: Request, res: Response) => {
    try {
        console.log("Approve Lead Request Body:", req.body);
        const { email, type } = req.body;

        if (!email) {
            console.error("Missing email in approveLead");
            return res.status(400).json({ error: "Email is required" });
        }

        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

        // ROBUST PERSISTENCE FIX: Read, Update Object, Save Array.
        // We avoid array index paths (like /leads[i]) which can be flaky with some DB versions.
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        let targetIndex = -1;
        // Find latest matching email
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email?.toLowerCase().trim() === email.toLowerCase().trim()) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) {
            // If lead not found (rare), maybe create one or error?
            // For now, assume it exists or we can't approve.
            // Try to approve generic credits anyway.
            console.warn(`Lead not found for ${email} during approval. Granting credits only.`);
        }

        if (type === 'CREDIT') {
            const val = await getVal(`/credits/${safeEmail}`);
            const currentCredits = Number(val || 0);

            console.log(`Manually Granting credit to ${safeEmail} (FORCE). New: ${currentCredits + 1}`);
            await setVal(`/credits/${safeEmail}`, currentCredits + 1);

            if (targetIndex !== -1) {
                const currentStatus = (leads[targetIndex] as any).status;
                if (currentStatus !== 'SUBSCRIBER') {
                    (leads[targetIndex] as any).status = 'APPROVED';
                    await setVal('/leads', leads); // Save FULL array
                }
            }
            return res.json({ success: true, newCredits: currentCredits + 1 });
        }

        if (targetIndex !== -1 && (leads[targetIndex] as any).plan?.name) {
            // PLAN APPROVAL
            console.log(`Manually Approving Plan for ${email}`);
            await setVal(`/users/${safeEmail}/plan`, {
                name: (leads[targetIndex] as any).plan.name,
                billing: (leads[targetIndex] as any).plan.billing,
                status: 'ACTIVE',
                startDate: new Date(),
                lastPayment: new Date()
            });

            (leads[targetIndex] as any).status = 'SUBSCRIBER';
            await setVal('/leads', leads); // Save FULL array

            res.json({ success: true, message: "Plan Activated Manually" });
        } else {
            // FALLBACK CREDIT APPROVAL
            const val = await getVal(`/credits/${safeEmail}`);
            const currentCredits = Number(val || 0);

            console.log(`Granting credit to ${safeEmail}.`);
            await setVal(`/credits/${safeEmail}`, currentCredits + 1);

            if (targetIndex !== -1) {
                (leads[targetIndex] as any).status = 'APPROVED';
                (leads[targetIndex] as any).isVoucher = true; // Mark as manually approved/voucher
                await setVal('/leads', leads); // Save FULL array
            }
            res.json({ success: true, newCredits: currentCredits + 1 });
        }
    } catch (e: any) {
        console.error("Error approving lead:", e);
        res.status(500).json({ error: "Error approving: " + e.message });
    }
};

// ... existing handler methods ...
export const handleKiwifyWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log("Kiwify Webhook Received:", JSON.stringify(payload));

        const status = payload.order_status;
        const email = payload.Customer?.email || payload.customer?.email;
        const productName = payload.Product?.name || payload.product?.name || "Produto";

        if (status === 'paid' && email) {
            console.log(`Payment confirmed for ${email} - Product: ${productName}`);

            // Extract Payment Info
            const paymentInfo = {
                payer: payload.Customer?.full_name || payload.customer?.full_name || "Desconhecido",
                payerEmail: email,
                amount: (payload.amount || payload.total || 0) / 100,
                product: productName
            };

            await pushVal('/orders', { ...payload, date: new Date(), paymentInfo });

            const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

            // --- DETECT PLAN ---
            let detectedPlan = null;
            let billing = 'monthly'; // default
            const pName = productName.toLowerCase();

            if (pName.includes('starter')) detectedPlan = 'STARTER';
            if (pName.includes('pro')) detectedPlan = 'PRO';
            if (pName.includes('black') || pName.includes('vip')) detectedPlan = 'BLACK';

            if (pName.includes('anual') || pName.includes('annual') || pName.includes('ano')) billing = 'annual';

            // Find and Update Lead
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            let leadIndex = -1;
            for (let i = leads.length - 1; i >= 0; i--) {
                const l: any = leads[i];
                if (l.email?.toLowerCase().trim() === email.toLowerCase().trim()) {
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
                await setVal(`/users/${safeEmail}/plan`, {
                    name: detectedPlan,
                    billing,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    lastPayment: new Date()
                });

                if (leadIndex !== -1) {
                    await setVal(`/leads[${leadIndex}]/plan`, { name: detectedPlan, billing });
                    await setVal(`/leads[${leadIndex}]/status`, 'SUBSCRIBER');
                }

                // DO NOT ADD CREDITS for Subscription itself (unless it comes with 1 free book? User didn't say).
                // User said: "Para ele gerar o primeiro livro... o valor deve ser X". So no free credits, just access + price.

            } else {
                // IT IS A BOOK PURCHASE (Credit)
                /* 
                   Check if it is a "Book Generation" product. 
                   If product name allows, we grant credit. 
                   For now, retain old logic: Grant 1 Credit.
                */
                const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                await setVal(`/credits/${safeEmail}`, currentCredits + 1);

                if (leadIndex !== -1) {
                    await setVal(`/leads[${leadIndex}]/status`, 'APPROVED');
                    await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                    await setVal(`/leads[${leadIndex}]/isVoucher`, true);
                }

                // Auto-Diagramming Logic (restored)
                try {
                    let targetLead: any = null;
                    for (let i = leads.length - 1; i >= 0; i--) {
                        const l: any = leads[i];
                        if (l.email?.toLowerCase().trim() === email.toLowerCase().trim() && l.type === 'DIAGRAMMING') {
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
                } catch (e) {
                    console.error("Auto-process error", e);
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Webhook Error", error);
        res.status(500).json({ error: "Internal Error" });
    }
};

// --- PRICING CONFIGURATION ---
// Maps Plan -> Billing -> Level (1-based) -> { price, link }
const PRICING_CONFIG: any = {
    'STARTER': {
        'annual': [
            { price: 24.90, link: 'https://pay.kiwify.com.br/SpCDp2q' }, // Level 1 (Base)
            { price: 22.41, link: 'https://pay.kiwify.com.br/0R6K3gC' }, // Level 2 (10% off)
            { price: 21.17, link: 'https://pay.kiwify.com.br/2HYq1Ji' }, // Level 3 (15% off)
            { price: 19.92, link: 'https://pay.kiwify.com.br/KZSbSjM' }  // Level 4 (20% off)
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

export const checkAccess = async (req: Request, res: Response) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).toLowerCase().trim().replace(/\./g, '_');
    const bypass = await getVal('/settings/payment_bypass');
    if (bypass) return res.json({ hasAccess: true, credits: 999, hasActiveProject: false });

    const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
    const userPlan: any = await getVal(`/users/${safeEmail}/plan`);

    // DEBUG CREDITS
    const allCredits = await getVal('/credits');
    console.log(`[CHECK_ACCESS] Email: ${email} -> Safe: ${safeEmail}`);
    console.log(`[CHECK_ACCESS] Credits Found: ${credits}`);
    // console.log(`[CHECK_ACCESS] All Credits Keys:`, Object.keys(allCredits || {}));

    if (credits > 0) console.log(`[POLL] ${safeEmail} has ${credits} credits. Access Granted.`);

    // --- Dynamic Pricing Logic ---
    let bookPrice = 39.90; // Default Avulso
    let checkoutUrl = 'https://pay.kiwify.com.br/QPTslcx'; // Default Checkout
    let planName = 'NONE';
    let discountLevel = 1;

    // Count Completed/Approved leads for this user to determine Level
    let usageCount = 0;
    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        usageCount = leads.filter((l: any) =>
            l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE')
        ).length;
    } catch (e) {
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

        const planConfig = PRICING_CONFIG[planName]?.[billing];
        if (planConfig && planConfig[cycleIndex]) {
            bookPrice = planConfig[cycleIndex].price;
            checkoutUrl = planConfig[cycleIndex].link;
            discountLevel = cycleIndex + 1;
        } else {
            // Fallback if config missing
            console.warn(`Missing pricing config for ${planName} ${billing} index ${cycleIndex}`);
        }
    }

    // Find active project logic (Retained)
    let leadStatus = null;
    let hasActiveProject = false;

    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email?.toLowerCase().trim() === (email as string).toLowerCase().trim()) {
                leadStatus = (leads[i] as any).status;
                break;
            }
        }
    } catch (e) { }

    try {
        const project = await getProjectByEmail((email as string).toLowerCase().trim());
        if (project && project.metadata.status !== 'COMPLETED' && project.metadata.status !== 'FAILED') {
            if (project.metadata.topic !== 'Livro Pré-Escrito') {
                hasActiveProject = true;
            }
        }
    } catch (e) { }

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
};

export const useCredit = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).toLowerCase().trim().replace(/\./g, '_');
    const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

    if (credits > 0) {
        await setVal(`/credits/${safeEmail}`, credits - 1);
        await updateLeadStatus(email, 'IN_PROGRESS');
        res.json({ success: true, remaining: credits - 1 });
    } else {
        return res.status(403).json({ error: "No credits available" });
    }
};

export const getPublicConfig = async (req: Request, res: Response) => {
    try {
        const { getConfig } = await import('../services/config.service');
        const config = await getConfig();
        res.json({ products: config.products || {} });
    } catch (e) {
        res.status(500).json({ error: "Failed to load config" });
    }
};

// Update a lead generic
export const updateLead = async (req: Request, res: Response) => {
    try {
        const { id, updates } = req.body;
        if (!id) return res.status(400).json({ error: "ID required" });

        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        let targetIndex = -1;
        for (let i = 0; i < leads.length; i++) {
            if ((leads[i] as any).id === id) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1) {
            const current = leads[targetIndex] as any;
            const updated = { ...current, ...updates };
            // Using logic from db.service which supports array path
            // /leads[0]
            await setVal(`/leads[${targetIndex}]`, updated);
            res.json({ success: true, lead: updated });
        } else {
            res.status(404).json({ error: "Lead not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// Delete a lead
export const deleteLead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ error: "ID required" });

        const rawLeads = await getVal('/leads') || [];
        let leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        const targetIndex = leads.findIndex((l: any) => l.id === id);

        if (targetIndex !== -1) {
            // Remove from array and save full array
            leads.splice(targetIndex, 1);
            await setVal('/leads', leads);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Lead not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
