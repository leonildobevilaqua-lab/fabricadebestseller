import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setVal, getVal, pushVal, reloadDB } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';
import multer from 'multer';
import { AsaasProvider } from '../services/asaas.provider';
const upload = multer();

// --- PRICING CONFIGURATION ---
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
    'STARTER': {
        annual: { price: 118.80, link: 'https://pay.kiwify.com.br/47E9CXl' },
        monthly: { price: 19.90, link: 'https://pay.kiwify.com.br/kfR54ZJ' }
    },
    'PRO': {
        annual: { price: 238.80, link: 'https://pay.kiwify.com.br/jXQTsFm' },
        monthly: { price: 34.90, link: 'https://pay.kiwify.com.br/Bls6OL7' }
    },
    'BLACK': {
        annual: { price: 358.80, link: 'https://pay.kiwify.com.br/hSv5tYq' },
        monthly: { price: 49.90, link: 'https://pay.kiwify.com.br/7UgxJ0f' }
    }
};

// Store a lead when user fills the form
export const createLead = async (req: Request, res: Response) => {
    try {
        await reloadDB();
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
            status: 'PENDING', // Force PENDING to prevent hacking (was req.body.status)
            date: new Date(),
            topic,
            authorName,
            tag,
            plan: plan ? { ...plan, status: 'PENDING' } : undefined,
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
        const { email } = req.body;
        const approvalType = req.body.type; // 'CREDIT' or undefined (Subscription)

        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        let targetIndex = -1;

        // Find latest lead
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email.toLowerCase().trim() === email.toLowerCase().trim()) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex === -1) {
            // Optional: Create if not found (Manual Grant case)
            // For safety, we only approve existing leads unless needed
            // But if User manually approves a random email in Admin (if supported), we'd need this.
            // Currently Admin.tsx passes existing emails.
            return res.status(404).json({ success: false, error: 'Lead not found' });
        }

        const currentLead = leads[targetIndex] as any;
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

        // LOGIC BRANCH: CREDIT vs SUBSCRIPTION
        if (approvalType === 'CREDIT') {
            // Admin is manually allowing a generation (Book Paid)
            // Add 1 Credit
            const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
            await setVal(`/credits/${safeEmail}`, currentCredits + 1);

            // Mark Lead as APPROVED (meaning they have access/credit) if not already
            if (currentLead.status !== 'APPROVED') {
                // Keep SUBSCRIBER status if valid, but maybe APPROVED implies "Project Ready"?
                // Let's stick to APPROVED for "Has Credit".
                // But if they are a SUBSCRIBER, we should probably keep that visible?
                // Actually, checkAccess checks credits. Status is secondary.
                // We'll update status to APPROVED to turn the button Green in Admin.
                currentLead.status = 'APPROVED';
                await setVal(`/leads[${targetIndex}]/status`, 'APPROVED');
            }

            console.log(`[ADMIN] Granted Credit to ${email}. Total: ${currentCredits + 1}`);

        } else {
            // SUBSCRIPTION ACTIVATION
            // Logic: Set Plan to ACTIVE. Set Lead Status to SUBSCRIBER.
            // DO NOT GRANT CREDITS (Credits remain 0 until Book Purchase)

            if (currentLead.plan) {
                // Activate Plan
                currentLead.plan.status = 'ACTIVE';
                currentLead.plan.startDate = new Date();

                // Update Lead Status to SUBSCRIBER
                currentLead.status = 'SUBSCRIBER';

                // Update array in DB
                await setVal(`/leads[${targetIndex}]`, currentLead);

                // Persist User Plan separately for easy lookup
                await setVal(`/users/${safeEmail}/plan`, currentLead.plan);

                console.log(`[ADMIN] Activated Subscription for ${email}. Plan: ${currentLead.plan.name}`);
            } else {
                // If it's a non-plan lead being approved without CREDIT type, assume standard approval (Legacy)
                // This might be "Liberar Geração" for old leads.
                // We will grant 1 credit here to be safe for legacy flows.
                const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                if (currentCredits === 0) {
                    await setVal(`/credits/${safeEmail}`, 1);
                }
                currentLead.status = 'APPROVED';
                await setVal(`/leads[${targetIndex}]`, currentLead);
            }
        }

        // Return success
        res.json({ success: true, lead: currentLead });
    } catch (error) {
        console.error('Erro ao aprovar lead:', error);
        res.status(500).json({ success: false, error: 'Erro ao aprovar lead' });
    }
};

export const handleKiwifyWebhook = async (req: Request, res: Response) => {
    try {
        await reloadDB();
        const payload = req.body;
        console.log("Webhook Received:", JSON.stringify(payload));

        let status = '';
        let email = '';
        let productName = '';
        let amount = 0;
        let payerName = '';
        let payerCpf = '';
        let payerPhone = '';
        let isAsaas = false;

        // --- DETECT PROVIDER ---
        if (payload.event && payload.payment) {
            // ASAAS
            isAsaas = true;
            console.log("Identifying Asaas Webhook");
            const evt = payload.event;
            const pm = payload.payment;

            if (evt === 'PAYMENT_CONFIRMED' || evt === 'PAYMENT_RECEIVED') status = 'paid';
            email = pm.customerEmail || (payload.customer && payload.customer.email); // Asaas sometimes sends customer object or just email? Usually we need to query customer or it's in payload? 
            // Asaas 'payment' object usually doesn't have email directly, but the top level payload might have logic or we need to rely on what we have.
            // Actually Asaas webhook has payment.customer (ID). We might need to fetch customer logic?
            // BUT, usually we pass custom data or we use the customer creation email.
            // In createCharge we created a customer. 
            // Let's assume for now we might need to lookup or it is passed.
            // Actually, Asaas `PAYMENT_CONFIRMED` payload often includes limited data.
            // BUT, wait. in `createCharge` validation we can check.
            // If email is missing, we might fail.
            // Let's check typical payload. Often `payment.details` or we have to use `payload.payment.externalReference` if we set it?
            // We didn't set externalReference in createCharge.
            // However, we can fetch customer details if needed.
            // For MVP, Asaas often sends detailed payload if configured? No.
            // We will try to extract what we can.

            // Asaas typically doesn't send email in the payment event payload directly, only customer ID.
            // Logic hack: We might have to fetch the customer from Asaas API or rely on local lookup?
            // Wait, we don't have a local mapping of CustomerID -> Email in `payment.controller`.

            // CRITICAL: We need the email to activate the plan.
            // If we can't get it from payload, we must fetch from Asaas.
            // We will use AsaasProvider (need to import getCustomer if exists, or adding it).
            // Let's assume we can import AsaasProvider.

            if (!email && pm.customer) {
                try {
                    // Use static import instead of dynamic to avoid module resolution issues
                    console.log(`[WEBHOOK] Fetching Customer ${pm.customer} from Asaas...`);
                    const customer = await AsaasProvider.getCustomer(pm.customer);
                    if (customer) {
                        email = customer.email;
                        payerName = customer.name;
                        payerCpf = customer.cpfCnpj;
                        console.log(`[WEBHOOK] Customer identified: ${email}`);
                    }
                } catch (err) { console.error("Failed to fetch Asaas customer", err); }
            }

            amount = pm.value;
            productName = pm.description || "Assinatura"; // Asaas description
        } else {
            // KIWIFY (Default)
            // Check for Token (User provided: 9f1su6po412)
            const token = req.query.token || req.body.token || req.params.token;
            if (token) {
                console.log("Kiwify Token present:", token);
                if (token === '9f1su6po412') console.log("Token MATCHES production key.");
                else console.warn("Token mismatch! Expected 9f1su6po412");
            } else {
                console.log("No Kiwify token found in request (Safe to ignore if not configured in dashboard, but user provided one).");
            }

            status = payload.order_status;
            email = payload.Customer?.email || payload.customer?.email;
            productName = payload.Product?.name || payload.product?.name || "Produto";
            amount = (payload.amount || payload.total || 0) / 100;
            payerName = payload.Customer?.full_name || payload.customer?.full_name;
        }

        if (status === 'paid' && email) {
            console.log(`Payment confirmed for ${email} - Product: ${productName}`);

            // Extract Payment Info
            const paymentInfo = {
                payer: payerName || "Desconhecido",
                payerEmail: email,
                amount: amount,
                product: productName,
                provider: isAsaas ? 'ASAAS' : 'KIWIFY',
                transactionId: payload.id || payload.payment?.id
            };

            await pushVal('/orders', { ...payload, date: new Date(), paymentInfo });

            const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

            // Find and Update Lead (Fetch fresh data)
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            // --- DETECT INTENT (GENERATION vs SUBSCRIPTION) ---
            const pName = (productName || "").toLowerCase();
            let isBookGeneration = false;

            // Explicit Keywords
            if (pName.includes('geração') || pName.includes('geracao') || pName.includes('generation') || pName.includes('livro')) {
                isBookGeneration = true;
            }
            // Fallback: Price Safety Net (10 to 40 BRL covers 13.52 to 26.90 and 39.90)
            if (amount > 10 && amount < 40) {
                console.log(`[WEBHOOK] Price Pattern Match for Book Generation: ${amount}`);
                isBookGeneration = true;
            }
            // Explicit Prices (Safety Net)
            const generationPrices = [16.90, 15.21, 14.37, 13.52, 14.90, 39.90, 26.90, 21.90, 19.90]; // Known book prices
            // Note: 19.90 is also starter monthly, so keyword is primary. Price secondary if no keywords?
            // Subscription prices usually have "Assinatura" or Plan name. Book gen has "Geração".
            // We trust keywords first.

            if (isBookGeneration) {
                console.log(`[WEBHOOK] ACTION: GRANT CREDIT for ${email} (Product: ${productName}, Val: ${amount})`);

                // GRANT CREDIT
                const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                const newCredits = currentCredits + 1;

                // 1. Update Source of Truth
                await setVal(`/credits/${safeEmail}`, newCredits);
                // 2. Mirror to User Object (as requested)
                await setVal(`/users/${safeEmail}/bookCredits`, newCredits);

                // Save last payment date
                await setVal(`/users/${safeEmail}/lastBookPayment`, new Date());
                await setVal(`/users/${safeEmail}/lastBookPaymentDate`, new Date());

                // Also update Lead if exists
                let leadIndex = leads.findIndex((l: any) => l.email?.toLowerCase().trim() === email.toLowerCase().trim());
                if (leadIndex !== -1) {
                    // Register the payment
                    await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                    await setVal(`/leads[${leadIndex}]/status`, 'APPROVED'); // Unblock access if pending
                }

                console.log(`[WEBHOOK] SUCCESS: Credits updated ${currentCredits} -> ${newCredits}`);

                // Trigger Diagramming if needed (Mock logic maintained)
                // ... (omitted for brevity, existing logic covers this if needed via lead updates)

            } else {
                // SUBSCRIPTION LOGIC
                let detectedPlan = null;
                let billing = 'monthly';

                // Parse Description for Plan
                if (pName.includes('starter')) detectedPlan = 'STARTER';
                if (pName.includes('pro')) detectedPlan = 'PRO';
                if (pName.includes('black') || pName.includes('vip')) detectedPlan = 'BLACK';

                if (pName.includes('anual') || pName.includes('annual') || pName.includes('ano')) billing = 'annual';

                // Fallback Price Check
                if (!detectedPlan) {
                    if (amount === 19.90 || amount === 118.80) { detectedPlan = 'STARTER'; }
                    if (amount === 34.90 || amount === 238.80) { detectedPlan = 'PRO'; }
                    if (amount === 49.90 || amount === 358.80) { detectedPlan = 'BLACK'; }
                    if (amount > 100) billing = 'annual';
                }

                if (detectedPlan) {
                    console.log(`[WEBHOOK] ACTION: ACTIVATE SUBSCRIPTION ${detectedPlan} for ${email}`);
                    await setVal(`/users/${safeEmail}/plan`, {
                        name: detectedPlan,
                        billing,
                        status: 'ACTIVE',
                        startDate: new Date(),
                        lastPayment: new Date()
                    });
                    // Also update Lead
                    let leadIndex = leads.findIndex((l: any) => l.email?.toLowerCase().trim() === email.toLowerCase().trim());
                    if (leadIndex !== -1) {
                        await setVal(`/leads[${leadIndex}]/plan`, { name: detectedPlan, billing });
                        await setVal(`/leads[${leadIndex}]/status`, 'SUBSCRIBER');
                        await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                    } else {
                        // Create Subscriber Lead
                        const newLead = {
                            id: uuidv4(),
                            date: new Date(),
                            email: email,
                            name: payerName,
                            type: 'BOOK',
                            status: 'SUBSCRIBER',
                            plan: { name: detectedPlan, billing },
                            paymentInfo,
                            tag: `PLANO ${detectedPlan}`
                        };
                        await pushVal('/leads', newLead);
                    }
                } else {
                    console.warn(`[WEBHOOK] UNHANDLED PAYMENT: ${productName} - ${amount}. Assuming Credit Grant fallback.`);
                    // Fallback to credit grant if we can't identify simple plan
                    const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
                    await setVal(`/credits/${safeEmail}`, currentCredits + 1);
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
    try {
        await reloadDB(); // CRITICAL: Force load from disk BEFORE reading anything
    } catch (e) {
        console.error("Values Reload Error:", e);
    }

    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).toLowerCase().trim().replace(/\./g, '_');
    const bypass = await getVal('/settings/payment_bypass');
    if (bypass) return res.json({ hasAccess: true, credits: 999, hasActiveProject: false });

    // NOW read specific paths with fresh data
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
    // --- Dynamic Pricing Logic ---
    let bookPrice = 39.90; // Default Avulso
    let checkoutUrl = 'https://pay.kiwify.com.br/QPTslcx'; // Default Checkout
    let planName = 'NONE';
    let discountLevel = 1;
    let leadStatus = null;
    let pendingPlan: any = null;
    let effectivePlan: any = null;
    let usageCount = 0;

    // 1. FETCH LEADS TO DETERMINE USAGE AND PENDING PLANS
    try {
        await reloadDB(); // FORCE SYNC to see Admin updates immediately
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Find most recent status/plan
        for (let i = leads.length - 1; i >= 0; i--) {
            const l = leads[i] as any;
            if (l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim()) {
                leadStatus = l.status;
                if (l.plan) pendingPlan = l.plan;

                // Prioritize 'APPROVED' or 'IN_PROGRESS' status to unblock generation
                if (leadStatus === 'APPROVED' || leadStatus === 'IN_PROGRESS' || leadStatus === 'ACTIVE') break;
            }
        }

        // Count Completed/Approved leads for this user to determine Level
        const leadsUsage = leads.filter((l: any) =>
            l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
        ).length;

        // Also count completed projects (robustness against broken lead links)
        let projectsUsage = 0;
        try {
            const projects = await getVal('/projects') || {};
            const projectList = Array.isArray(projects) ? projects : Object.values(projects);
            projectsUsage = projectList.filter((p: any) =>
                p.userEmail?.toLowerCase().trim() === (email as string).toLowerCase().trim() &&
                (p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE')
            ).length;
        } catch (e) { }

        usageCount = Math.max(leadsUsage, projectsUsage);

        // 2. DETERMINE PLAN TRUTH
        effectivePlan = (userPlan && userPlan.status === 'ACTIVE') ? userPlan : null;

        // Fallback: If no userPlan found in /users/, but we found a valid SUBSCRIBER lead in /leads/
        // Fallback: If no userPlan found in /users/, but we found a valid SUBSCRIBER lead in /leads/
        if (!effectivePlan && leadStatus === 'SUBSCRIBER') {
            console.log(`[CHECK_ACCESS] Fallback: Found Subscriber Lead for ${safeEmail} but no /users/ plan. Using Lead Plan.`);
            effectivePlan = pendingPlan;
            // Auto-heal: Write it back to /users/
            if (effectivePlan) {
                setVal(`/users/${safeEmail}/plan`, { ...effectivePlan, status: 'ACTIVE' });
            }
        }

        if (effectivePlan) {
            // Validate Expiration only if it's the Active User Plan
            let isValid = true;
            let billing = (effectivePlan.billing || 'monthly').toLowerCase();

            // If we are relying on effectivePlan from lead, treat it as active for date check
            const startDate = effectivePlan.startDate ? new Date(effectivePlan.startDate) : new Date();
            let expiryDate = new Date(startDate);
            if (billing === 'annual') expiryDate.setFullYear(startDate.getFullYear() + 1);
            else expiryDate.setDate(startDate.getDate() + 31);

            // 3 Days Grace Period
            expiryDate.setDate(expiryDate.getDate() + 3);

            if (new Date() > expiryDate) {
                console.log(`[SUBSCRIPTION] Plan Expired for ${safeEmail}`);
                if (userPlan) {
                    userPlan.status = 'EXPIRED';
                    setVal(`/users/${safeEmail}/plan`, { ...userPlan, status: 'EXPIRED' });
                }
                isValid = false;
            }

            if (isValid) {
                // Normalize Plan Name
                const rawName = (effectivePlan.name || 'STARTER').toUpperCase();
                if (rawName.includes('BLACK')) planName = 'BLACK';
                else if (rawName.includes('PRO')) planName = 'PRO';
                else planName = 'STARTER';

                // Cycle Logic
                const cycleIndex = usageCount % 4; // 0, 1, 2, 3

                const planConfig = PRICING_CONFIG[planName]?.[billing];
                if (planConfig && planConfig[cycleIndex]) {
                    bookPrice = planConfig[cycleIndex].price;
                    checkoutUrl = planConfig[cycleIndex].link;
                    discountLevel = cycleIndex + 1;
                }

                // FORCE ACTIVE STATUS IN RESPONSE if Valid
                if (!userPlan) userPlan = { ...effectivePlan, status: 'ACTIVE' };
            }
        }

        // Capture effective plan for price calculation
        effectivePlan = userPlan || pendingPlan;
        if (effectivePlan) {
            const pName = effectivePlan.name || planName;
            const pBilling = effectivePlan.billing || 'monthly';
            // Override planName for downstream logic
            planName = pName;
        }

    } catch (e) {
        console.error("Error calculating access/price", e);
    }

    // Find active project logic (Retained)
    let hasActiveProject = false;

    try {
        const project = await getProjectByEmail((email as string).toLowerCase().trim());
        if (project && project.metadata.status !== 'COMPLETED' && project.metadata.status !== 'FAILED') {
            const status = project.metadata.status;
            // STRENGTHENED SECURITY: 
            // Only consider a project "Active" (bypassing payment) if it is actually processing.
            // IDLE or WAITING_TITLE states might exist from abandoned attempts; they DO NOT grant access if credits are 0.
            if (credits > 0) {
                hasActiveProject = true;
            } else {
                // If no credits, restricted statuses only
                if (status !== 'IDLE' && status !== 'WAITING_TITLE') {
                    hasActiveProject = true;
                }
            }

            if (project.metadata.topic === 'Livro Pré-Escrito') {
                hasActiveProject = false;
            }
        }
    } catch (e) { }

    if (hasActiveProject) {
        const isVip = String(email).toLowerCase().includes('subevilaqua');
        if (!isVip && leadStatus !== 'APPROVED' && leadStatus !== 'LIVRO ENTREGUE' && leadStatus !== 'IN_PROGRESS' && credits <= 0) {
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
        discountLevel,
        activeProjectId: hasActiveProject ? (await getProjectByEmail((email as string).toLowerCase().trim()))?.id : null,
        // Helper for frontend total sum
        subscriptionPrice: (effectivePlan && SUBSCRIPTION_PRICES[planName]?.[(effectivePlan.billing || 'monthly').toLowerCase()]?.price) ||
            (pendingPlan && pendingPlan.price) ||
            49.90,
        planLabel: effectivePlan
            ? `Plano ${planName} ${(effectivePlan.billing === 'annual' ? 'Anual' : 'Mensal')}`
            : (pendingPlan ? `Plano ${pendingPlan.name} ${(pendingPlan.billing === 'annual' ? 'Anual' : 'Mensal')}` : 'Avulso'),
        totalBooksGenerated: usageCount
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

export const createBookGenerationCharge = async (req: Request, res: Response) => {
    try {
        console.log("[PURCHASE] Initiation Request:", req.body);
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        await reloadDB();

        // 1. Determine User Plan
        let plan = await getVal(`/users/${safeEmail}/plan`);

        // Fallback to searching leads if no user plan
        if (!plan) {
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            const subLead = leads.find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                l.status === 'SUBSCRIBER'
            );
            if (subLead && subLead.plan) plan = subLead.plan;
        }

        const planName = plan ? (plan.name || 'STARTER').toUpperCase() : 'STARTER';
        // Normalize Plan Name
        let finalPlanName = 'STARTER';
        if (planName.includes('BLACK')) finalPlanName = 'BLACK';
        else if (planName.includes('PRO')) finalPlanName = 'PRO';

        const billing = plan ? (plan.billing || 'monthly').toLowerCase() : 'monthly';

        // 2. Determine Cycle Level (Usage)
        // Count confirmed usage
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        const usageCount = leads.filter((l: any) =>
            l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
        ).length;

        const cycleIndex = usageCount % 4; // 0, 1, 2, 3

        // 3. Get Price
        const prices = PRICING_CONFIG[finalPlanName]?.[billing] || PRICING_CONFIG['STARTER']['monthly'];
        const price = prices[cycleIndex] || prices[0];
        // Handle object format in PRICING_CONFIG which might have {price, link} or just price if I changed it?
        // In this file, PRICING_CONFIG has objects { price: number, link: string }.
        const finalPrice = typeof price === 'object' ? price.price : price;

        // 4. Create Asaas Charge
        // Get/Create Customer
        const userProfile = await getVal(`/users/${safeEmail}/profile`) || {};
        const customerId = await AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });

        // Create Payment
        // BillingType UNDEFINED allows user to choose PIX or BOLETO
        const payment = await AsaasProvider.createPayment(
            customerId,
            finalPrice,
            `Geração de Livro - ${finalPlanName} - Ciclo ${cycleIndex + 1}/4`
        );

        console.log(`[PURCHASE] Created charge for ${email}: ${finalPrice} (${payment.invoiceUrl})`);

        return res.json({
            success: true,
            invoiceUrl: payment.invoiceUrl,
            price: finalPrice,
            level: cycleIndex + 1
        });

    } catch (e: any) {
        console.error("Purchase Error:", e);
        return res.status(500).json({ error: e.message || "Failed to create charge" });
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

export const createCharge = async (req: Request, res: Response) => {
    try {
        const { email, type, payer } = req.body;
        let price = 39.90; // Fallback

        await reloadDB();
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        const userPlan = await getVal(`/users/${safeEmail}/plan`);

        if (userPlan && userPlan.status === 'ACTIVE') {
            const pName = (userPlan.name || 'STARTER').toUpperCase();
            if (pName.includes('BLACK')) price = 16.90;
            else if (pName.includes('PRO')) price = 21.90;
            else price = 26.90;
        }

        const customerId = await AsaasProvider.createCustomer({
            name: payer?.name || 'Cliente',
            email,
            cpfCnpj: payer?.cpfCnpj,
            phone: payer?.phone
        });
        const payment = await AsaasProvider.createPayment(customerId, price, `Geração de Livro - ${type || 'Avulso'}`);

        res.json({ success: true, invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl, price });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
