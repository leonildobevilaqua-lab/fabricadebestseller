import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setVal, getVal, pushVal, reloadDB } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';
import multer from 'multer';
import { AsaasProvider } from '../services/asaas.provider';
const upload = multer();

// -----------------------------------------------------------------
// FONTE DA VERDADE — PREÇOS FIXOS TABELADOS (sem descontos progressivos)
// -----------------------------------------------------------------
const PRICING_RULES: Record<string, number> = {
    'AVULSO': 89.90, // Sem plano ativo
    'STARTER_MENSAL': 28.90,
    'STARTER_ANUAL': 24.90,
    'PRO_MENSAL': 18.90,
    'PRO_ANUAL': 14.90,
    'BLACK_MENSAL': 9.90,
    'BLACK_ANUAL': 8.90,
};

// Preços de assinatura (recorrência Asaas)
const SUBSCRIPTION_PRICES: any = {
    'STARTER': {
        monthly: { price: 19.90 },
        annual: { price: 147.90 }
    },
    'PRO': {
        monthly: { price: 39.90 },
        annual: { price: 297.90 }
    },
    'BLACK': {
        monthly: { price: 79.90 },
        annual: { price: 497.90 }
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
            const safeEmail = lead.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
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
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

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

            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

            // Find and Update Lead (Fetch fresh data)
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            // --- DETECT INTENT (GENERATION vs SUBSCRIPTION) ---
            const pName = (productName || "").toLowerCase();
            let isSubscription = false;
            let isBookGeneration = false;

            // Explicit Keywords
            if (pName.includes('assinatura') || pName.includes('plano') || pName.includes('starter') || pName.includes('pro') || pName.includes('black') || pName.includes('vip')) {
                isSubscription = true;
            }

            if (pName.includes('geração') || pName.includes('geracao') || pName.includes('generation') || pName.includes('livro')) {
                isBookGeneration = true;
            }

            // Fallback: Price Safety Net (only if keywords didn't catch it)
            if (!isBookGeneration && !isSubscription) {
                const generationPrices = [24.90, 22.41, 21.17, 19.92, 26.90, 24.21, 22.87, 21.52, 19.90, 17.91, 16.92, 15.92, 21.90, 19.71, 18.62, 17.52, 14.90, 13.41, 12.67, 11.92, 16.90, 15.21, 14.37, 13.52, 39.90];
                const isExactPrice = generationPrices.some(p => Math.abs(p - amount) < 0.05);

                if (isExactPrice || (amount > 8 && amount < 45)) {
                    // Treat known subscription amounts as subscriptions, rest as generation
                    if (Math.abs(amount - 19.90) < 0.05 || Math.abs(amount - 39.90) < 0.05 || Math.abs(amount - 79.90) < 0.05) {
                        isSubscription = true;
                    } else {
                        isBookGeneration = true;
                    }
                }
            }

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
                    if (amount === 19.90 || amount === 147.90) { detectedPlan = 'STARTER'; }
                    if (amount === 39.90 || amount === 297.90) { detectedPlan = 'PRO'; }
                    if (amount === 79.90 || amount === 497.90) { detectedPlan = 'BLACK'; }
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

                    // Search for lead again to ensure fresh scope index
                    const leadIndex = leads.findIndex((l: any) => l.email?.toLowerCase().trim() === email.toLowerCase().trim());

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
        await reloadDB();
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: "Email required" });

        const safeEmail = (email as string).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        let credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
        let userPlan: any = await getVal(`/users/${safeEmail}/plan`);
        let latestInvoiceStatus: any = null;
        let latestInvoiceNumber: any = null;
        let asaasPayments: any[] = [];

        const rawOrders = await getVal('/orders') || [];
        const orders = Array.isArray(rawOrders) ? rawOrders : Object.values(rawOrders);
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Fetch truth from Asaas
        try {
            const customer = await AsaasProvider.getCustomerByEmail(email as string);
            if (customer) {
                asaasPayments = await AsaasProvider.getPayments({ customer: customer.id, limit: 50 });
                asaasPayments.sort((a: any, b: any) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

                const latestRel = asaasPayments.find((p: any) => {
                    const desc = (p.description || "").toLowerCase();
                    return desc.includes('geração') || desc.includes('livro') || desc.includes('assinatura') ||
                        desc.includes('plano') || desc.includes('starter') || desc.includes('pro') || desc.includes('black');
                });

                if (latestRel) {
                    latestInvoiceStatus = latestRel.status;
                    latestInvoiceNumber = latestRel.invoiceNumber || latestRel.id;
                }
            }
        } catch (e) { console.error("[ASAAS_FETCH]", e); }

        // IMMEDIATE ACTIVATION (RESILIENCE)
        const confirmedPayment = asaasPayments.find((p: any) => {
            const isConfirmed = p.status === 'RECEIVED' || p.status === 'CONFIRMED';
            const desc = (p.description || "").toLowerCase();
            const isPlan = desc.includes('assinatura') || desc.includes('plano') || desc.includes('starter') || desc.includes('pro') || desc.includes('black');
            return isConfirmed && isPlan;
        });

        if (confirmedPayment && (!userPlan || userPlan.status !== 'ACTIVE')) {
            console.log(`[CHECK_ACCESS] Activating plan locally for ${email}`);
            const desc = (confirmedPayment.description || '').toUpperCase();
            let pName = 'STARTER';
            if (desc.includes('BLACK')) pName = 'BLACK';
            else if (desc.includes('PRO')) pName = 'PRO';

            userPlan = {
                status: 'ACTIVE',
                name: pName,
                billing: desc.includes('ANUAL') ? 'annual' : 'monthly',
                lastPayment: new Date(),
                subscriptionId: confirmedPayment.subscription || null
            };
            await setVal(`/users/${safeEmail}/plan`, userPlan);

            // Sync Leads for Admin Visibility
            const leadIdx = leads.findIndex((l: any) => l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim());
            if (leadIdx !== -1) {
                await setVal(`/leads[${leadIdx}]/status`, 'SUBSCRIBER');
                await setVal(`/leads[${leadIdx}]/plan`, userPlan);
            }
        }

        // Sync Credits
        const validGenPrices = [89.90, 28.90, 24.90, 18.90, 14.90, 9.90, 8.90, 16.90, 15.21, 14.37, 13.52, 26.90, 21.90]; // Does NOT include sub prices (19.90, 39.90, 79.90)
        const validPaidList = asaasPayments.filter(p => {
            if (p.status !== 'RECEIVED' && p.status !== 'CONFIRMED') return false;

            const desc = (p.description || '').toLowerCase();
            const isPlan = desc.includes('assinatura') || desc.includes('plano') || desc.includes('starter') || desc.includes('pro') || desc.includes('black');
            if (isPlan) return false;

            const isGenPrice = validGenPrices.some(vp => Math.abs(vp - p.value) < 0.1);
            return isGenPrice || desc.includes('livro') || desc.includes('geração');
        });

        const usedCount = orders.filter((o: any) => o.status === 'COMPLETED' || o.status === 'PROCESSING' || o.status === 'LIVRO ENTREGUE').length;
        let theoretical = Math.max(0, validPaidList.length - usedCount);

        if (theoretical !== credits) {
            credits = theoretical;
            await setVal(`/credits/${safeEmail}`, credits);
        }

        // Lead & Usage
        let leadStatus = null;
        let pendingPlan: any = null;
        for (let i = leads.length - 1; i >= 0; i--) {
            const l = leads[i] as any;
            if (l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim()) {
                leadStatus = l.status;
                if (l.plan) pendingPlan = l.plan;
                if (leadStatus === 'SUBSCRIBER') break;
            }
        }

        const usageCount = leads.filter((l: any) => l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() && (l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS' || l.status === 'APPROVED')).length;

        // Pricing Logic
        let bookPrice = PRICING_RULES['AVULSO'] || 89.90;
        let planLabel = 'Avulso';
        let planName = userPlan ? userPlan.name : (pendingPlan ? pendingPlan.name : 'NONE');

        if (userPlan && userPlan.status === 'ACTIVE') {
            const billingKey = (userPlan.billing || 'monthly').toLowerCase() === 'annual' ? 'ANUAL' : 'MENSAL';
            const cleanName = planName.toUpperCase();
            const lookup = cleanName.includes('BLACK') ? 'BLACK' : (cleanName.includes('PRO') ? 'PRO' : 'STARTER');
            bookPrice = PRICING_RULES[`${lookup}_${billingKey}`] || 39.90;
            planLabel = `Plano ${lookup} ${billingKey === 'ANUAL' ? 'Anual' : 'Mensal'}`;
            planName = lookup;
        }

        let hasActiveProject = false;
        try {
            const project = await getProjectByEmail((email as string).toLowerCase().trim());
            if (project && project.metadata.status !== 'COMPLETED' && project.metadata.status !== 'FAILED') {
                if (credits > 0 || (project.metadata.status !== 'IDLE' && project.metadata.status !== 'WAITING_TITLE')) hasActiveProject = true;
            }
        } catch (e) { }

        const portalAccess = !!((userPlan && userPlan.status === 'ACTIVE') || hasActiveProject);
        const hasAccess = (credits > 0 || hasActiveProject) && (latestInvoiceStatus !== 'PENDING' && latestInvoiceStatus !== 'OVERDUE');

        res.json({
            hasAccess,
            portalAccess,
            credits,
            hasActiveProject,
            leadStatus,
            plan: userPlan,
            pendingPlan,
            bookPrice,
            latestInvoiceStatus,
            latestInvoiceNumber,
            activeProjectId: hasActiveProject ? (await getProjectByEmail((email as string).toLowerCase().trim()))?.id : null,
            subscriptionPrice: (userPlan && SUBSCRIPTION_PRICES[planName]?.[(userPlan.billing || 'monthly').toLowerCase()]?.price) || (pendingPlan && pendingPlan.price) || 79.90,
            planLabel,
            totalBooksGenerated: usageCount
        });
    } catch (error) {
        console.error("Critical CheckAccess Error", error);
        res.status(500).json({ error: "Internal Error" });
    }
};

export const useCredit = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
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
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        await reloadDB();

        // 1. Identificar Plano e Ciclo
        let plan = await getVal(`/users/${safeEmail}/plan`);

        // Fallback search via leads (only if plan is truly ACTIVE)
        if (!plan || plan.status !== 'ACTIVE') {
            const rawLeadsCheck = await getVal('/leads') || [];
            const actionLead = Object.values(rawLeadsCheck).find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() && l.status === 'SUBSCRIBER'
            );
            // CRITICAL: Only accept the lead's plan if it's ACTIVE, otherwise treat as AVULSO
            if (actionLead && (actionLead as any).plan && (actionLead as any).plan.status === 'ACTIVE') {
                plan = (actionLead as any).plan;
            } else {
                plan = null; // Force AVULSO pricing
            }
        }

        // If plan is not null but not ACTIVE, force null so pricing is AVULSO
        if (plan && plan.status !== 'ACTIVE') {
            console.log(`[CHARGE] Plan found for ${email} but status is ${plan.status} (not ACTIVE). Treating as AVULSO.`);
            plan = null;
        }

        const planName = plan ? (plan.name || 'STARTER').toUpperCase() : 'AVULSO';
        let cleanPlan = 'AVULSO'; // Default is now AVULSO (safe fallback)
        if (plan) {
            // Only apply plan-specific pricing if we have a valid ACTIVE plan
            if (planName.includes('BLACK')) cleanPlan = 'BLACK';
            else if (planName.includes('PRO')) cleanPlan = 'PRO';
            else if (planName.includes('STARTER')) cleanPlan = 'STARTER';
            // else stays AVULSO
        }

        const billingRaw = plan ? (plan.billing || 'monthly').toLowerCase() : 'monthly';
        const billingSuffix = (billingRaw === 'annual' || billingRaw === 'anual') ? 'ANUAL' : 'MENSAL';

        const planKey = cleanPlan === 'AVULSO' ? 'AVULSO' : `${cleanPlan}_${billingSuffix}`;

        console.log(`[CHARGE] Email: ${email} | planKey: ${planKey} | plan: ${plan?.name || 'NONE'} | status: ${plan?.status || 'N/A'}`);

        // 2. Preço fixo por planKey (sem ciclos de desconto progressivo)
        const price: number = PRICING_RULES[planKey] ?? PRICING_RULES['AVULSO'];

        console.log(`[CHARGE] Email: ${email} | planKey: ${planKey} | price: R$ ${price}`);

        // 3. Criar Cobrança no Asaas
        const userProfile = await getVal(`/users/${safeEmail}/profile`) || {};
        const customerId = await AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });

        // [ANTI-SPAM] Check if there is already a PENDING invoice for generation to avoid duplication
        // CRITICAL: ONLY reuse if the PRICE matches. Otherwise, it's a stale/wrong invoice.
        try {
            const existingPayments = await AsaasProvider.getPayments({ customer: customerId, status: 'PENDING', limit: 20 });
            const duplicate = existingPayments.find((pm: any) => {
                const desc = (pm.description || "").toLowerCase();
                const isGen = desc.includes('geração') || desc.includes('livro');
                const priceMatch = Math.abs(pm.value - price) < 0.1;
                return isGen && priceMatch;
            });

            if (duplicate) {
                console.log(`[CHARGE] Found existing PENDING invoice ${duplicate.id} for ${email} with correct price R$ ${price}. Reusing.`);
                return res.json({
                    success: true,
                    invoiceUrl: duplicate.invoiceUrl || duplicate.bankSlipUrl,
                    isReused: true,
                    price: duplicate.value
                });
            }
        } catch (err: any) {
            console.error("[CHARGE] Error checking for duplicate payments", err);
        }

        const charge = await AsaasProvider.createPayment(
            customerId,
            price,
            `Geração de Livro - ${cleanPlan} (R$ ${price.toFixed(2)})`
        );

        return res.json({ success: true, invoiceUrl: charge.invoiceUrl });

    } catch (error: any) {
        console.error('Falha ao criar cobrança:', error);
        return res.status(500).json({ error: error.message || 'Falha ao criar cobrança' });
    }
};


// DUMMY IMPLEMENTATION TO FIX BUILD (config.service missing)
export const getPublicConfig = async (req: Request, res: Response) => {
    try {
        // const { getConfig } = await import('../services/config.service');
        // const config = await getConfig();
        res.json({ products: {} });
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
            const leadId = leadToDelete.id;

            // Remove from array (Legacy sync, might not be needed but keep for safety)
            leads.splice(targetIndex, 1);

            // CRITICAL: Delete the individual key from Supabase
            if (leadId) {
                const { deleteVal } = require('../services/db.service');
                await deleteVal(`/leads/${leadId}`);
            }

            // SYNC: IF USER DELETES SUBSCRIPTION LEAD, REMOVE ACCESS
            if (email) {
                const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
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

        await reloadDB();
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        // -- Determina o plano ativo (mesma lógica de createBookGenerationCharge) --
        let plan = await getVal(`/users/${safeEmail}/plan`);

        if (!plan || plan.status !== 'ACTIVE') {
            const rawLeadsCheck = await getVal('/leads') || [];
            const actionLead = Object.values(rawLeadsCheck).find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() && l.status === 'SUBSCRIBER'
            );
            if (actionLead && (actionLead as any).plan && (actionLead as any).plan.status === 'ACTIVE') {
                plan = (actionLead as any).plan;
            } else {
                plan = null; // Sem plano ativo = AVULSO
            }
        }

        if (plan && plan.status !== 'ACTIVE') plan = null;

        const planNameRaw = plan ? (plan.name || 'STARTER').toUpperCase() : 'AVULSO';
        let cleanPlan = 'AVULSO';
        if (plan) {
            if (planNameRaw.includes('BLACK')) cleanPlan = 'BLACK';
            else if (planNameRaw.includes('PRO')) cleanPlan = 'PRO';
            else if (planNameRaw.includes('STARTER')) cleanPlan = 'STARTER';
        }

        const billingRaw = plan ? (plan.billing || 'monthly').toLowerCase() : 'monthly';
        const billingSuffix = (billingRaw === 'annual' || billingRaw === 'anual') ? 'ANUAL' : 'MENSAL';
        const planKey = cleanPlan === 'AVULSO' ? 'AVULSO' : `${cleanPlan}_${billingSuffix}`;

        // Preço fixo por planKey (sem ciclos progressivos)
        const price: number = PRICING_RULES[planKey] ?? PRICING_RULES['AVULSO'];

        console.log(`[CHARGE] Email: ${email} | planKey: ${planKey} | price: R$ ${price}`);

        const customerId = await AsaasProvider.createCustomer({
            name: payer?.name || email.split('@')[0],
            email,
            cpfCnpj: payer?.cpfCnpj,
            phone: payer?.phone
        });
        const payment = await AsaasProvider.createPayment(customerId, price, `Geração de Livro - ${type || 'Avulso'} (${cleanPlan})`);

        // --- ADMIN VISIBILITY: Register PENDING Order ---
        try {
            await pushVal('/orders', {
                id: payment.id,
                email,
                name: payer?.name || email,
                amount: price,
                type: 'BOOK',
                description: `Geração de Livro - ${cleanPlan} (Aguardando Pagamento)`,
                date: new Date().toISOString(),
                paymentInfo: {
                    provider: 'ASAAS',
                    id: payment.id,
                    amount: price,
                    status: 'PENDING',
                    invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl
                }
            });
        } catch (orderErr) {
            console.warn("[CHARGE] Failed to log pending order:", orderErr);
        }

        res.json({ success: true, invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl, price });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// ─── CATÁLOGO DE SERVIÇOS EXTRAS ────────────────────────────────────────────
export const EXTRA_SERVICES_CATALOG: Record<string, { label: string; price: number; description: string }> = {
    'livro-ingles': { label: 'Tradução — Livro em Inglês', price: 24.99, description: 'Tradução completa do livro para Inglês' },
    'livro-espanhol': { label: 'Tradução — Livro em Espanhol', price: 24.99, description: 'Tradução completa do livro para Espanhol' },
    'capa-impressa': { label: 'Capa Profissional (Impresso)', price: 250.00, description: 'Design de capa profissional para livro impresso' },
    'capa-digital': { label: 'Capa Profissional (Ebook / Digital)', price: 149.90, description: 'Design de capa profissional para ebook' },
    'amazon-impresso': { label: 'Publicação Amazon (Impresso)', price: 69.90, description: 'Publicação do livro impresso na Amazon KDP' },
    'amazon-digital': { label: 'Publicação Amazon (Digital)', price: 59.90, description: 'Publicação do ebook na Amazon KDP' },
    'uiclap-impresso': { label: 'Publicação UICLAP (Impresso)', price: 59.90, description: 'Publicação do livro impresso na UICLAP' },
    'ficha-catalografica': { label: 'Criação de Ficha Catalográfica', price: 59.90, description: 'Ficha catalográfica padronizada AACR2/RDA' },
    'isbn-impresso': { label: 'ISBN CBL — Livro Impresso', price: 49.90, description: 'Registro de ISBN na CBL para livro impresso' },
    'isbn-digital': { label: 'ISBN CBL — Livro Digital', price: 49.90, description: 'Registro de ISBN na CBL para ebook' },
    'pacote-completo': { label: 'Pacote Completo de Serviços', price: 599.90, description: 'Todos os serviços: Tradução + Capa + Publicação + ISBN + Ficha' },
};

/**
 * POST /api/payment/extra-service
 * Gera fatura Asaas para serviço extra com preço fixo do catálogo.
 * Após confirmação do pagamento, detalhes são enviados por e-mail.
 */
export const createExtraServiceCharge = async (req: Request, res: Response) => {
    try {
        const { email, name, phone, cpfCnpj, serviceKey } = req.body;

        if (!email || !serviceKey) {
            return res.status(400).json({ error: 'E-mail e serviço são obrigatórios.' });
        }

        const service = EXTRA_SERVICES_CATALOG[serviceKey];
        if (!service) {
            return res.status(400).json({ error: `Serviço desconhecido: ${serviceKey}` });
        }

        console.log(`[EXTRA] ${email} => "${service.label}" R$ ${service.price}`);

        const customerId = await AsaasProvider.createCustomer({
            name: name || email.split('@')[0],
            email,
            cpfCnpj,
            phone,
        });

        const payment = await AsaasProvider.createPayment(
            customerId,
            service.price,
            `${service.label} — Fábrica de Best Sellers`
        );

        // Salva pedido extra para rastreamento admin
        try {
            await pushVal('/extra_orders', {
                id: `extra_${Date.now()}`,
                email,
                name: name || email,
                phone: phone || '',
                type: 'EXTRA_SERVICE',
                serviceKey,
                serviceName: service.label,
                servicePrice: service.price,
                status: 'PENDING',
                date: new Date(),
                asaas_payment_id: payment.id,
            });
        } catch (dbErr) {
            console.warn('[EXTRA] Falha ao salvar pedido (não crítico):', dbErr);
        }

        return res.json({
            success: true,
            invoiceUrl: payment.invoiceUrl || payment.bankSlipUrl,
            price: service.price,
            serviceName: service.label,
            message: `Fatura gerada! Após o pagamento, você receberá os detalhes no e-mail ${email}.`,
        });
    } catch (e: any) {
        console.error('[EXTRA SERVICE]', e.message);
        return res.status(500).json({ error: e.message || 'Erro ao gerar fatura.' });
    }
};
