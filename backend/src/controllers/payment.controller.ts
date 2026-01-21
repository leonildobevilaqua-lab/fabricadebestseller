import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setVal, getVal, pushVal, reloadDB } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';
import multer from 'multer';
const upload = multer();

// --- PRICING CONFIGURATION ---
const PRICING_CONFIG: any = {
    'STARTER': {
        'annual': [
            { price: 24.90, link: 'https://pay.kiwify.com.br/SpCDp2q' }, // Level 1 (Base)
            { price: 22.41, link: 'https://pay.kiwify.com.br/0R6K3gC' }, // Level 2 (10% off)
            { price: 21.17, link: 'https://pay.kiwify.com.br/2HYq1Ji' }, // Level 3 (15% off)
            { price: 19.92, link: 'https://pay.kiwify.com.br/KZSbSjM' }  // Level 4 (20% off)
        ],
        'monthly': [
            { price: 26.90, link: 'https://pay.kiwify.com.br/g1L85dO' }, // Level 1
            { price: 24.21, link: 'https://pay.kiwify.com.br/iztHm1K' }, // Level 2
            { price: 22.87, link: 'https://pay.kiwify.com.br/tdpPzXY' }, // Level 3
            { price: 21.52, link: 'https://pay.kiwify.com.br/Up1n5lb' }  // Level 4
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

const SUBSCRIPTION_PRICES: any = {
    'STARTER': { annual: 118.80, monthly: 19.90 },
    'PRO': { annual: 238.80, monthly: 34.90 },
    'BLACK': { annual: 358.80, monthly: 49.90 }
};

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
        await reloadDB();
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
            const currentStatus = (leads[targetIndex] as any).status;
            // PRESERVE SUBSCRIBER STATUS
            if (currentStatus === 'SUBSCRIBER') {
                // If status implies book progress, save to productionStatus instead of overwriting SUBSCRIBER
                const progressStatuses = ['IN_PROGRESS', 'RESEARCHING', 'WRITING_CHAPTERS', 'COMPLETED', 'LIVRO ENTREGUE'];
                if (progressStatuses.includes(newStatus)) {
                    console.log(`[UPDATE] Preserving SUBSCRIBER status for ${email}, setting productionStatus to ${newStatus}`);
                    await setVal(`/leads[${targetIndex}]/productionStatus`, newStatus);
                    return;
                }
            }
            // Standard update
            await setVal(`/leads[${targetIndex}]/status`, newStatus);
        }
    } catch (e) {
        console.error("Error updating lead status:", e);
    }
};

// Approve a lead (Grant free access OR Activate Plan)
export const approveLead = async (req: Request, res: Response) => {
    try {
        await reloadDB();
        console.log("Approve Lead Request Body:", req.body);
        const { email, type, plan } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        let targetIndex = -1;
        // Find latest pending lead
        for (let i = leads.length - 1; i >= 0; i--) {
            const l: any = leads[i];
            if (l.email?.toLowerCase().trim() === email.toLowerCase().trim() && l.status === 'PENDING') {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) {
            // Create New Lead logic (simplified for Manual Grant)
            targetIndex = leads.length;
            leads.push({
                id: uuidv4(), // FIX: Ensure ID exists
                email,
                status: 'PENDING',
                type: type || 'CREDIT',
                date: new Date(),
                created_at: new Date(),
                name: email.split('@')[0] || 'Manual Grant'
            });
        }

        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        let manualAmount = 0;

        // DETERMINE ACTION: PLAN ACTIVATION OR CREDIT GRANT?
        // Check if an explicit plan is passed, OR if the lead already has a Pending Plan (and we are not forcing CREDIT)
        const storedPlan = targetIndex !== -1 ? (leads[targetIndex] as any).plan : null;
        const planToActivate = plan || (storedPlan && storedPlan.status !== 'ACTIVE' && type !== 'CREDIT' ? storedPlan : null);

        if (planToActivate) {
            // Manual Plan Grant
            leads[targetIndex].plan = { ...planToActivate, status: 'ACTIVE' };
            leads[targetIndex].status = 'SUBSCRIBER'; // Plan Lead is Subscriber

            // Set User Plan in DB
            await setVal(`/users/${safeEmail}/plan`, { ...planToActivate, status: 'ACTIVE' });

            // Calc Value
            const pName = planToActivate.name?.toUpperCase();
            const billing = planToActivate.billing?.toLowerCase();
            manualAmount = SUBSCRIPTION_PRICES[pName]?.[billing] || 0;

            // CREDIT GRANT REMOVED
        } else {
            // Manual Extra Book Grant (Credit)
            leads[targetIndex].status = 'APPROVED';
            leads[targetIndex].isVoucher = true;

            // Grant +1 Credit
            const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
            await setVal(`/credits/${safeEmail}`, credits + 1);

            // Calc Value (Progressive Discount Logic)
            // Need usageCount (include this new one? No, previous history).
            const usageCount = leads.filter((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
            ).length;

            // Get Plan Name
            const userPlan: any = await getVal(`/users/${safeEmail}/plan`);
            let planName = 'NONE';
            if (userPlan && userPlan.status === 'ACTIVE') planName = userPlan.name || 'STARTER';

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
                const planConfig = PRICING_CONFIG[planName]?.[billing];
                if (planConfig && planConfig[cycleIndex]) {
                    manualAmount = planConfig[cycleIndex].price;
                } else {
                    manualAmount = 39.90; // Fallback
                }
            } else {
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

        await setVal('/leads', leads);

        // Trigger auto flow if diagramming
        // ... (omitted for brevity, assume manual is final)

        res.json({ success: true, lead: leads[targetIndex] });

    } catch (e: any) {
        console.error("Approve Lead Error", e);
        res.status(500).json({ error: e.message });
    }
};

export const handleKiwifyWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log("Kiwify Webhook Received:", JSON.stringify(payload));

        // Check for Token (User provided: 9f1su6po412)
        const token = req.query.token || req.body.token || req.params.token;
        if (token) {
            console.log("Kiwify Token present:", token);
            if (token === '9f1su6po412') console.log("Token MATCHES production key.");
            else console.warn("Token mismatch! Expected 9f1su6po412");
        } else {
            console.log("No Kiwify token found in request (Safe to ignore if not configured in dashboard, but user provided one).");
        }

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

                await setVal(`/users/${safeEmail}/plan`, {
                    name: detectedPlan,
                    billing,
                    status: 'ACTIVE',
                    startDate: new Date(),
                    lastPayment: new Date()
                });

                // GRANT CREDIT FOR SUBSCRIPTION PAYMENT (Fixes "Access" issue)
                // CREDIT GRANT REMOVED: Subscription purely unlocks discounts. No free credits.
                /*
                const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                const creditsToAdd = billing === 'annual' ? 12 : 1; // 12 for annual, 1 for monthly
                console.log(`Granting ${creditsToAdd} credits for Subscription ${detectedPlan} (${billing})`);
                await setVal(`/credits/${safeEmail}`, currentCredits + creditsToAdd);
                */

                if (leadIndex !== -1) {
                    await setVal(`/leads[${leadIndex}]/plan`, { name: detectedPlan, billing });
                    await setVal(`/leads[${leadIndex}]/status`, 'SUBSCRIBER');

                    // FIX: Register Payment Value for Admin Panel and Specific TAG
                    const planTag = `PLANO ${detectedPlan} ${billing === 'annual' ? 'ANUAL' : 'MENSAL'}`;
                    await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                    await setVal(`/leads[${leadIndex}]/tag`, planTag);
                }

            } else {
                // IT IS A BOOK PURCHASE (Credit)
                const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                await setVal(`/credits/${safeEmail}`, currentCredits + 1);

                if (leadIndex !== -1) {
                    const existingLead = leads[leadIndex] as any;

                    // IF EXISTING LEAD IS BUSY WITH PREVIOUS BOOK -> CREATE NEW LEAD FOR THIS PURCHASE
                    if (existingLead.status === 'IN_PROGRESS' || existingLead.status === 'COMPLETED' || existingLead.status === 'LIVRO ENTREGUE') {
                        console.log("Creating NEW Lead for additional purchase (Recurring)");
                        const newLead = {
                            id: uuidv4(),
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
                        await pushVal('/leads', newLead);
                    } else {
                        // UPDATE PENDING LEAD
                        await setVal(`/leads[${leadIndex}]/status`, 'APPROVED');
                        await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                        await setVal(`/leads[${leadIndex}]/isVoucher`, true);
                    }
                } else {
                    // NO LEAD FOUND -> CREATE NEW
                    console.log("Creating NEW Lead for direct purchase");
                    const newLead = {
                        id: uuidv4(),
                        date: new Date(),
                        email: email,
                        name: paymentInfo.payer,
                        type: 'BOOK',
                        status: 'APPROVED',
                        paymentInfo,
                        tag: 'Compra Direta',
                        isVoucher: true
                    };
                    await pushVal('/leads', newLead);
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

export const checkAccess = async (req: Request, res: Response) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).toLowerCase().trim().replace(/\./g, '_');
    const bypass = await getVal('/settings/payment_bypass');
    if (bypass) return res.json({ hasAccess: true, credits: 999, hasActiveProject: false });

    const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
    let userPlan: any = await getVal(`/users/${safeEmail}/plan`);

    // FETCH LEADS & VERIFY PLAN INTEGRITY
    let leads: any[] = [];
    try {
        const rawLeads = await getVal('/leads') || [];
        leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // SYNC: If user has 'ACTIVE' plan in DB but NO matching Subscriber Lead -> Revoke it.
        // DISABLE REVOCATION as per user request ("Jamais desative o plano")
        /*
        if (userPlan && userPlan.status === 'ACTIVE') {
            const hasActiveSub = leads.some((l: any) =>
                l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
                (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'))
            );
            if (!hasActiveSub) {
                console.log(`[SYNC] Revoking orphaned plan for ${email} (No active lead found)`);
                userPlan = null;
                setVal(`/users/${safeEmail}/plan`, null); // Async cleanup
            }
        }
        */
    } catch (e) {
        console.error("Error fetching leads for sync", e);
    }

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
    const leadsUsage = leads.filter((l: any) =>
        l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
        (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
    ).length;

    // Also count completed projects (robustness against broken lead links)
    // We can get projects from DB.
    let projectsUsage = 0;
    try {
        const projects = await getVal('/projects') || {};
        const projectList = Array.isArray(projects) ? projects : Object.values(projects);
        projectsUsage = projectList.filter((p: any) =>
            p.userEmail?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
            (p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE')
        ).length;
    } catch (e) { }

    const usageCount = Math.max(leadsUsage, projectsUsage);

    if (userPlan && userPlan.status === 'ACTIVE') {
        // --- EXPIRATION CHECK ---
        const startDate = userPlan.startDate ? new Date(userPlan.startDate) : new Date();
        const billing = (userPlan.billing || 'monthly').toLowerCase();
        let expiryDate = new Date(startDate);

        if (billing === 'annual') {
            expiryDate.setFullYear(startDate.getFullYear() + 1);
        } else {
            // Monthly - Add 30 days (plus grace period?)
            expiryDate.setDate(startDate.getDate() + 31);
        }

        const now = new Date();
        if (now > expiryDate) {
            console.log(`[SUBSCRIPTION] Plan Expired for ${safeEmail}. Start: ${startDate.toISOString()}, Exp: ${expiryDate.toISOString()}`);
            userPlan.status = 'EXPIRED'; // Update local object
            // Persist expiration
            setVal(`/users/${safeEmail}/plan`, { ...userPlan, status: 'EXPIRED' });
        } else {
            // Valid Plan
            planName = userPlan.name || 'STARTER';

            // Cycle: 0->L1, 1->L2, 2->L3, 3->L4, 4->L1 ...
            // usageCount includes previous purchases.
            // If usageCount is 0 (new sub), they are at Level 1.
            // If usageCount is 3 (3 books done), they are at Level 4 for the NEXT.
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
    }

    // Find active project logic (Retained)
    // Find active project logic (Retained)
    let leadStatus = null;
    let hasActiveProject = false;
    let pendingPlan = null;

    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email?.toLowerCase().trim() === (email as string).toLowerCase().trim()) {
                leadStatus = (leads[i] as any).status;
                if ((leads[i] as any).plan) pendingPlan = (leads[i] as any).plan;
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
        pendingPlan,
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
            const leadToDelete = leads[targetIndex] as any;
            const email = leadToDelete.email;

            // Remove from array and save full array
            leads.splice(targetIndex, 1);
            await setVal('/leads', leads);

            // SYNC: IF USER DELETES SUBSCRIPTION LEAD, REMOVE ACCESS
            if (email) {
                const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
                const hasActiveSub = leads.some((l: any) =>
                    l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                    (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'))
                );

                if (!hasActiveSub) {
                    console.log(`Deleting Plan for ${email} as last subscription lead was removed.`);
                    await setVal(`/users/${safeEmail}/plan`, null);
                }
            }

            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Lead not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
