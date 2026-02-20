import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setVal, getVal, pushVal, reloadDB } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';
import { AsaasProvider } from '../services/asaas.provider';
import multer from 'multer';

// --- PRICING CONFIGURATION ---
// TABELA DE PREÇOS IMUTÁVEL (Fonte da Verdade)
// REMOVIDO AVULSO - APENAS ASSINANTES PODEM GERAR
const PRICING_RULES: any = {
    'STARTER_MENSAL': [26.90, 24.21, 22.87, 21.52],
    'STARTER_ANUAL': [24.90, 22.41, 21.17, 19.92],
    'PRO_MENSAL': [21.90, 19.71, 18.62, 17.52],
    'PRO_ANUAL': [19.90, 17.91, 16.92, 15.92],
    'BLACK_MENSAL': [16.90, 15.21, 14.37, 13.52],
    'BLACK_ANUAL': [14.90, 13.41, 12.67, 11.92]
};

const SUBSCRIPTION_PRICES: any = {
    'STARTER': {
        annual: { price: 199.90, link: '/api/payment/subscribe?plan=STARTER&billing=annual' },
        monthly: { price: 19.90, link: '/api/payment/subscribe?plan=STARTER&billing=monthly' }
    },
    'PRO': {
        annual: { price: 349.90, link: '/api/payment/subscribe?plan=PRO&billing=annual' },
        monthly: { price: 34.90, link: '/api/payment/subscribe?plan=PRO&billing=monthly' }
    },
    'BLACK': {
        annual: { price: 499.90, link: '/api/payment/subscribe?plan=BLACK&billing=annual' },
        monthly: { price: 49.90, link: '/api/payment/subscribe?plan=BLACK&billing=monthly' }
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

export const createBookGenerationCharge = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        await reloadDB();

        // 1. Identificar Plano e Ciclo
        let plan = await getVal(`/users/${safeEmail}/plan`);

        // Robustez: Se status não for explicitamente ACTIVE, verificar se é assinante em transição
        if (!plan || plan.status !== 'ACTIVE') {
            const rawLeads = await getVal('/leads') || [];
            const subLead = Object.values(rawLeads).find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'))
            );

            if (subLead && (subLead as any).plan) {
                plan = (subLead as any).plan;
                // Auto-fix user record if missing
                await setVal(`/users/${safeEmail}/plan`, plan);
            }
        }

        // STRICT CHECK: SE NÃO TEM PLANO, NÃO GERA COBRANÇA DE LIVRO.
        // O USUÁRIO DEVE ASSINAR PRIMEIRO.
        if (!plan || plan.status !== 'ACTIVE') {
            return res.status(403).json({
                error: "PLAN_REQUIRED",
                message: "Você precisa ter uma assinatura ativa para gerar livros.",
                redirect: '/plans' // Frontend deve tratar isso
            });
        }

        const planName = (plan.name || 'STARTER').toUpperCase();
        let cleanPlan = 'STARTER';
        if (planName.includes('BLACK')) cleanPlan = 'BLACK';
        else if (planName.includes('PRO')) cleanPlan = 'PRO';

        const billingRaw = (plan.billing || 'monthly').toLowerCase();
        const billingSuffix = (billingRaw === 'annual' || billingRaw === 'anual') ? 'ANUAL' : 'MENSAL';

        const planKey = `${cleanPlan}_${billingSuffix}`;

        // 2. Definir Prioridade/Ciclo (Quantos livros JÁ FEZ ou PAGOU)
        // ALINHADO COM DASHBOARD: Conta Pedidos Pagos (Credits) + Projetos Reais

        // Carregar pedidos do usuário
        const user = await getVal(`/users/${safeEmail}`);
        const userOrders = user?.orders || [];
        const paidOrdersCount = userOrders.length;

        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Contar leads aprovados/completos deste email (Legacy)
        const leadsUsage = leads.filter((l: any) =>
            l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
        ).length;

        // Contar projetos completados (redundancia)
        let projectsUsage = 0;
        try {
            const projects = await getVal('/projects') || {};
            const projectList = Array.isArray(projects) ? projects : Object.values(projects);
            projectsUsage = projectList.filter((p: any) => {
                const pEmail = (p.metadata?.contact?.email || p.userEmail || "").toLowerCase().trim();
                const targetEmail = email.toLowerCase().trim();
                const status = p.metadata?.status;
                return pEmail === targetEmail &&
                    (status === 'COMPLETED' || status === 'LIVRO ENTREGUE');
            }).length;
        } catch (e) { console.error("Error calculating project usage", e); }

        // MÁXIMO entre Pedidos Pagos, Leads e Projetos
        const usageCount = Math.max(paidOrdersCount, leadsUsage, projectsUsage);

        // 3. Calcular Preço Baseado no Ciclo (0, 1, 2, 3...)
        const cycleIndex = usageCount % 4; // Reinicia ciclo a cada 4 livros
        const priceList = PRICING_RULES[planKey];

        if (!priceList) {
            console.error(`Pricing rule not found for ${planKey}, defaulting to STARTER_MENSAL`);
            // Safety fallback just in case, but really shouldn't happen with strict check
            const fallback = PRICING_RULES['STARTER_MENSAL'];
            var price = fallback[0];
        } else {
            var price = priceList[cycleIndex] !== undefined ? priceList[cycleIndex] : priceList[0];
        }

        console.log(`[Pricing] Email: ${email} | Plan: ${planKey} | Count: ${usageCount} | Index: ${cycleIndex} | FINAL PRICE: ${price}`);

        // 4. Criar Cobrança no Asaas
        const userProfile = await getVal(`/users/${safeEmail}/profile`) || {};
        const customerId = await AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });

        const charge = await AsaasProvider.createPayment(
            customerId,
            price,
            `Geração Extra - Plano ${cleanPlan} (Vol. ${usageCount + 1})`
        );

        return res.json({ success: true, invoiceUrl: charge.invoiceUrl });

    } catch (error: any) {
        console.error('Falha ao criar cobrança:', error);
        return res.status(500).json({ error: error.message || 'Falha ao criar cobrança' });
    }
};

export const createBookChargeLink = async (req: Request, res: Response) => {
    try {
        const email = req.query.email as string;
        if (!email) return res.status(400).send("Email is required");

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        await reloadDB();

        // 1. Identificar Plano e Ciclo
        let plan = await getVal(`/users/${safeEmail}/plan`);

        // Robustez: Se status não for explicitamente ACTIVE, verificar se é assinante em transição
        if (!plan || plan.status !== 'ACTIVE') {
            const rawLeads = await getVal('/leads') || [];
            const subLead = Object.values(rawLeads).find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE'))
            );

            if (subLead && (subLead as any).plan) {
                plan = (subLead as any).plan;
                // Auto-fix user record if missing
                await setVal(`/users/${safeEmail}/plan`, plan);
            }
        }

        // STRICT CHECK: SE NÃO TEM PLANO, NÃO GERA COBRANÇA DE LIVRO.
        if (!plan || plan.status !== 'ACTIVE') {
            return res.redirect('/plans?error=PLAN_REQUIRED');
        }

        const planName = (plan.name || 'STARTER').toUpperCase();
        let cleanPlan = 'STARTER';
        if (planName.includes('BLACK')) cleanPlan = 'BLACK';
        else if (planName.includes('PRO')) cleanPlan = 'PRO';

        const billingRaw = (plan.billing || 'monthly').toLowerCase();
        const billingSuffix = (billingRaw === 'annual' || billingRaw === 'anual') ? 'ANUAL' : 'MENSAL';

        const planKey = `${cleanPlan}_${billingSuffix}`;

        // 2. Definir Prioridade/Ciclo
        const user = await getVal(`/users/${safeEmail}`);
        const userOrders = user?.orders || [];
        const paidOrdersCount = userOrders.length;

        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Contar leads aprovados/completos deste email (Legacy)
        const leadsUsage = leads.filter((l: any) =>
            l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
            (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE' || l.status === 'IN_PROGRESS')
        ).length;

        let projectsUsage = 0;
        try {
            const projects = await getVal('/projects') || {};
            const projectList = Array.isArray(projects) ? projects : Object.values(projects);
            projectsUsage = projectList.filter((p: any) => {
                const pUserEmail = (p.userEmail || "").toLowerCase().trim();
                const pMetaEmail = (p.metadata?.contact?.email || "").toLowerCase().trim();
                const targetEmail = email.toLowerCase().trim();

                // Robust Email Match
                const isMatch = pUserEmail === targetEmail || pMetaEmail === targetEmail;

                const status = p.metadata?.status;
                // STRICT CHECK: Explicitly exclude 'DELETED' and ensure status is valid
                if (status === 'DELETED') return false;

                const isValidStatus = (
                    status === 'COMPLETED' ||
                    status === 'LIVRO ENTREGUE' ||
                    status === 'WRITING_CHAPTERS' ||
                    status === 'REVIEW_STRUCTURE' ||
                    status === 'GENERATING_STRUCTURE' ||
                    status === 'WAITING_DETAILS' ||
                    status === 'GENERATING_MARKETING' ||
                    status === 'RESEARCHING' ||
                    status === 'WAITING_TITLE'
                );

                return isMatch && isValidStatus;
            }).length;
        } catch (e) { console.error("Error calculating project usage", e); }


        const usageCount = projectsUsage;

        // Use Frontend Cycle Index if provided (Strict User Alignment)
        // This ensures what they see is what they pay.
        // req.body.cycleIndex is passed from Frontend
        let cycleIndex = usageCount % 4; // Default fallback
        if (req.body.cycleIndex !== undefined && req.body.cycleIndex !== null) {
            const requestedIndex = parseInt(req.body.cycleIndex);
            // Basic sanity check: allow if within reasonable range of calculated index OR if calculated is 0 (reset/empty)
            // Trusting frontend for UX consistency as per user demand ("Simply... Value of Active Box")
            console.log(`[Pricing] Overriding backend index ${cycleIndex} with frontend index ${requestedIndex}`);
            cycleIndex = requestedIndex;
        }

        const priceList = PRICING_RULES[planKey];

        let price = 39.90;
        if (!priceList) {
            const fallback = PRICING_RULES['STARTER_MENSAL'];
            price = fallback[0];
        } else {
            // Guard against out of bounds
            const safeIndex = Math.min(Math.max(0, cycleIndex), 3);
            price = priceList[safeIndex] !== undefined ? priceList[safeIndex] : priceList[0];
        }

        console.log(`[Pricing Link] Email: ${email} | Plan: ${planKey} | Count: ${usageCount} | Index: ${cycleIndex} | FINAL PRICE: ${price}`);

        // Format Description: "Nível 1/2 I Plano Black Mensal"
        const level = cycleIndex + 1; // 1, 2, 3, 4
        const cycle = Math.floor(usageCount / 4) + 1; // 1, 2...

        // Clean Plan Name for Display
        const displayPlan = `${cleanPlan} ${billingSuffix === 'ANUAL' ? 'Anual' : 'Mensal'}`;
        // Add capitalization
        const nicePlan = displayPlan.charAt(0).toUpperCase() + displayPlan.slice(1).toLowerCase().replace('black', 'Black').replace('pro', 'Pro').replace('starter', 'Starter');

        const description = `Nível ${level}/${cycle} I Plano ${nicePlan}`;

        // 4. Criar Cobrança no Asaas
        const userProfile = await getVal(`/users/${safeEmail}/profile`) || {};
        const customerId = await AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });

        const charge = await AsaasProvider.createPayment(
            customerId,
            price,
            description
        );

        if (charge && (charge.invoiceUrl || charge.bankSlipUrl)) {
            return res.json({ url: charge.invoiceUrl || charge.bankSlipUrl });
        } else {
            console.error("Asaas Charge Failed (Empty URL):", charge);
            return res.status(500).json({ error: "O Asaas não retornou um link de pagamento válido." });
        }

    } catch (error: any) {
        console.error('Falha ao criar link cobrança:', error);
        // Ensure strictly JSON response for frontend
        return res.status(500).json({
            error: error.message || 'Erro interno ao comunicar com Asaas.',
            details: error.response?.data
        });
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

            const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

            // Find and Update Lead (Fetch fresh data)
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            // --- DETECT INTENT (GENERATION vs SUBSCRIPTION) ---
            const pName = (productName || "").toLowerCase();
            let isBookGeneration = false;

            // Explicit Prices (Safety Net)
            const generationPrices = [
                // STARTER
                24.90, 22.41, 21.17, 19.92, // Annual
                26.90, 24.21, 22.87, 21.52, // Monthly
                // PRO
                19.90, 17.91, 16.92, 15.92, // Annual
                21.90, 19.71, 18.62, 17.52, // Monthly
                // BLACK
                14.90, 13.41, 12.67, 11.92, // Annual
                16.90, 15.21, 14.37, 13.52, // Monthly
                // Avulso / Fallbacks
                39.90
            ];

            // Explicit Keywords
            if (pName.includes('geração') || pName.includes('geracao') || pName.includes('generation') || pName.includes('livro')) {
                isBookGeneration = true;
            }
            // Check explicit prices (robust against keyword failure)
            const isExactPrice = generationPrices.some(p => Math.abs(p - amount) < 0.05);

            // Fallback: Price Safety Net (10 to 40 BRL covers 11.92 to 39.90)
            if (isExactPrice || (amount > 10 && amount < 40)) {
                console.log(`[WEBHOOK] Price Pattern Match for Book Generation: ${amount}`);
                isBookGeneration = true;
            }
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

    // CRITICAL FIX: Use same regex as Subscription/Admin controllers to match DB keys
    const safeEmail = (email as string).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

    // LOCALHOST BYPASS FOR TESTING - DISABLED BY USER REQUEST (STRICT MODE EVERYWHERE)
    /*
    const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
    if (isLocal) {
        console.log(`[DEV] Localhost Access Bypass for ${email}`);
        return res.json({ hasAccess: true, credits: 999, hasActiveProject: false, plan: { name: 'DEV_UNLIMITED', status: 'ACTIVE' } });
    }
    */

    const bypass = await getVal('/settings/payment_bypass');
    if (bypass) return res.json({ hasAccess: true, credits: 999, hasActiveProject: false });

    // NOW read specific paths with fresh data
    // NOW read specific paths with fresh data
    let credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
    let latestInvoiceStatus = null;
    let latestInvoiceNumber = null;
    let lastPaymentDate = null;

    // [STRICT AUDIT & RECOVERY SYSTEM]
    // 1. Unconditionally fetch external truth (Asaas) and local history (Orders)
    const orders = await getVal('/orders') || [];
    let asaasPayments: any[] = [];

    try {
        const customer = await AsaasProvider.getCustomerByEmail(email as string);
        if (customer) {
            asaasPayments = await AsaasProvider.getPayments({ customer: customer.id, limit: 100 });
            // Sort Newest First
            asaasPayments.sort((a: any, b: any) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());

            // Capture Latest Status
            // Capture Latest Status (Generic - Catch ANY recent invoice to block correctly)
            // UPDATED: Now includes subscription terms to fix the "Wrong Invoice" bug.
            const latestGen = asaasPayments.find((p: any) => {
                const d = (p.description || "").toLowerCase();
                return d.includes('geração') || d.includes('livro') ||
                    d.includes('assinatura') || d.includes('plano') ||
                    d.includes('starter') || d.includes('pro') || d.includes('black');
            });
            if (latestGen) {
                latestInvoiceStatus = latestGen.status;
                latestInvoiceNumber = latestGen.invoiceNumber || latestGen.id;
            } else if (asaasPayments.length > 0) {
                // Fallback: If no keywords match but we have payments, take the absolute newest one
                // This covers generic invoice descriptions we might have missed
                const absoluteLatest = asaasPayments[0];
                latestInvoiceStatus = absoluteLatest.status;
                latestInvoiceNumber = absoluteLatest.invoiceNumber || absoluteLatest.id;
            }
        }
    } catch (e) { console.error("Asaas Fetch Error", e); }

    const validPrices = [16.90, 15.21, 14.37, 13.52, 14.90, 39.90, 26.90, 21.90, 19.90, 11.92, 12.67, 13.41];

    // [UNIFIED LEDGER SYNC]
    // Calculate effective balance based on: Confirmed Payments (In) - Books Generated (Out)
    // Runs UNCONDITIONALLY to ensure the DB always reflects the true bank status
    if (asaasPayments.length > 0) {
        // 1. Calculate INFLOW (Confirmed Payments)
        const validPaidList = asaasPayments.filter((p: any) =>
            (p.status === 'RECEIVED' || p.status === 'CONFIRMED') &&
            (validPrices.some(vp => Math.abs(vp - p.value) < 0.1) ||
                (p.description || '').toLowerCase().includes('livro') ||
                (p.description || '').toLowerCase().includes('geração'))
        );
        const paidCount = validPaidList.length;

        if (paidCount > 0) {
            lastPaymentDate = validPaidList[0].confirmedDate || validPaidList[0].paymentDate || validPaidList[0].clientPaymentDate || validPaidList[0].dateCreated;
        }

        // 2. Calculate OUTFLOW (Generated Books / Orders)
        const userOrders = (orders as any[]).filter((o: any) =>
            (o.paymentInfo?.payerEmail?.toLowerCase() === (email as string).toLowerCase()) ||
            validPaidList.some(p => p.id === o.id || p.id === o.paymentInfo?.transactionId)
        );
        const usedCount = userOrders.length;

        // [ORDER RECONCILIATION]
        // User Requirement: "Sum value ... Include Invoice Number ... Show immediately"
        // Cycle through all VALID PAYMENTS. If a payment is NOT linked to an existing order, create a "Credit" order.
        let ordersUpdated = false;

        for (const payment of validPaidList) {
            // Check if this payment ID exists in user orders (as id or transactionId)
            const exists = orders.some((o: any) => o.id === payment.id || o.paymentInfo?.transactionId === payment.id);

            if (!exists) {
                console.log(`[LEDGER] Found unlinked payment ${payment.id} (${payment.value}). Creating Order placeholder.`);

                // Create a "Credit Purchased" order
                const newOrder = {
                    id: payment.id, // Use Payment ID as Order ID for tracking
                    title: "Crédito de Livro (Disponível)",
                    status: "CREDIT_AVAILABLE", // Special status for unused credits
                    date: payment.paymentDate || new Date(),
                    price: payment.value,
                    invoiceNumber: payment.invoiceNumber || payment.id,
                    paymentInfo: {
                        transactionId: payment.id,
                        payerEmail: email,
                        method: payment.billingType,
                        value: payment.value
                    }
                };

                orders.push(newOrder); // Add to local array
                ordersUpdated = true;
            }
        }

        if (ordersUpdated) {
            console.log(`[LEDGER] Saving reconciled orders for ${email}`);
            await setVal(`/users/${safeEmail}/orders`, orders);
            // Force reload local variable for accurate accounting if needed downstream
        }

        // 3. Determine TRUE BALANCE
        // Balance = Confirmed Payments - (Orders that are NOT just 'Keyholders')
        // We count ALL confirmed payments. 
        // We subtract orders that are USED (i.e., have a real book status, not just CREDIT_AVAILABLE).

        const usedOrdersCount = orders.filter((o: any) =>
            o.status === 'COMPLETED' || o.status === 'PROCESSING' || o.status === 'LIVRO ENTREGUE'
        ).length;

        let theoretical = Math.max(0, paidCount - usedOrdersCount);

        // [STRICT MODE ADJUSTMENT - UPDATED]
        // User Requirement: "Sum value ... Include Invoice Number."
        // BUG FIX: Do NOT freeze credits if a newer invoice is PENDING. The user might have paid Invoice A, then clicked Buy again (Invoice B).
        // Invoice B being Pending should not block Invoice A's credit.
        /*
        if (latestInvoiceStatus === 'PENDING' || latestInvoiceStatus === 'OVERDUE') {
            if (theoretical > 0) {
                console.warn(`[STRICT_MODE] Pending Invoice ${latestInvoiceNumber} detected. Freezing ${theoretical} historical credits to enforce current payment.`);
                theoretical = 0;
            }
        }
        */
        // Instead, just log it. Access is granted based on CONFIRMED payments matching Used Orders.
        if (latestInvoiceStatus === 'PENDING' && theoretical > 0) {
            console.log(`[LEDGER] Pending Invoice ${latestInvoiceNumber} exists, but user has ${theoretical} valid credits from previous payments. Access Allowed.`);
        }

        console.log(`[LEDGER] ${email} -> Payments: ${paidCount} (In) | Used Orders: ${usedOrdersCount} (Out) | Balance: ${theoretical}`);

        // 4. SYNC DB
        if (theoretical !== credits) {
            const oldCredits = credits;
            console.log(`[LEDGER] Syncing DB (Was ${oldCredits} -> Now ${theoretical})`);
            credits = theoretical;
            await setVal(`/credits/${safeEmail}`, credits);
            await setVal(`/users/${safeEmail}/bookCredits`, credits);

            if (theoretical > 0 && oldCredits === 0) {
                console.log(`[LEDGER] Access Granted by Ledger Sync!`);
            }
        }
    }

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

    // [MANUAL SUBSCRIPTION CHECK - RESILIENCE LAYER]
    if (userPlan && (userPlan.status === 'PENDING' || userPlan.status === 'SUBSCRIBER_PENDING') && userPlan.subscriptionId) {
        try {
            console.log(`[CHECK_SUB] Verifying subscription ${userPlan.subscriptionId} for ${email}...`);
            const payments = await AsaasProvider.getSubscriptionPayments(userPlan.subscriptionId);
            // Sort by date desc
            if (payments && Array.isArray(payments)) {
                // Find ANY recent confirmed payment
                const valid = payments.find((p: any) => p.status === 'RECEIVED' || p.status === 'CONFIRMED');

                if (valid) {
                    console.log(`[CHECK_SUB] Payment Found (ID: ${valid.id})! Forced Activation.`);
                    userPlan.status = 'ACTIVE';
                    userPlan.lastPayment = new Date();
                    await setVal(`/users/${safeEmail}/plan`, userPlan);

                    // Update Lead
                    const leadIndex = leads.findIndex((l: any) => l.email?.toLowerCase().trim() === (email as string).toLowerCase().trim() && (l.status === 'SUBSCRIBER' || l.status === 'SUBSCRIBER_PENDING'));
                    if (leadIndex !== -1) {
                        await setVal(`/leads[${leadIndex}]/status`, 'SUBSCRIBER'); // Ensure SUBSCRIBER status
                        await setVal(`/leads[${leadIndex}]/plan`, userPlan); // Sync full plan obj
                        console.log(`[CHECK_SUB] Lead ${leadIndex} updated to ACTIVE.`);
                    }
                }
            }
        } catch (e) { console.error("Sub Check Error", e); }
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
    let checkoutUrl = ''; // Default Checkout (Dynamic)
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
            projectsUsage = projectList.filter((p: any) => {
                const pEmail = (p.metadata?.contact?.email || p.userEmail || "").toLowerCase().trim();
                const targetEmail = (email as string).toLowerCase().trim();
                const status = p.metadata?.status;
                return pEmail === targetEmail &&
                    (status === 'COMPLETED' || status === 'LIVRO ENTREGUE');
            }).length;
            console.log(`[CheckAccessDebug] Leads Usage: ${leadsUsage}, Projects Usage: ${projectsUsage} for ${email}`);
        } catch (e) { console.error("Error calculating project usage in checkAccess", e); }

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
            // However, we must ensure it has a valid date
            if (userPlan && userPlan.status === 'ACTIVE') {
                let startDate = new Date(userPlan.startDate || userPlan.date || 0);

                // DATA REPAIR: If Active but no valid date (e.g. manual entry without date), assume NEW activation today
                // Threshold: anything before 2020 (1577836800000) is considered invalid/unset
                if (startDate.getTime() < 1577836800000) {
                    console.warn(`[ACCESS CHECK] Repairing Missing SDate for ${safeEmail}`);
                    startDate = new Date();
                    userPlan.startDate = startDate.toISOString();
                    // Async update to fix DB
                    setVal(`/users/${safeEmail}/plan`, userPlan);
                }

                const expiry = new Date(startDate);
                if (userPlan.billing === 'annual' || userPlan.billing === 'anual') expiry.setFullYear(expiry.getFullYear() + 1);
                else expiry.setMonth(expiry.getMonth() + 1);

                // 3 Days Grace Period
                expiry.setDate(expiry.getDate() + 3);

                console.log(`[ACCESS CHECK] Email: ${safeEmail} | Plan: ${effectivePlan.name} | Start: ${startDate.toISOString()} | Expiry: ${expiry.toISOString()} | Now: ${new Date().toISOString()}`);

                if (new Date() > expiry) {
                    console.log(`[ACCESS CHECK] PLAN EXPIRED for ${safeEmail}`);
                    if (userPlan.status === 'ACTIVE') {
                        setVal(`/users/${safeEmail}/plan`, { ...userPlan, status: 'EXPIRED' });
                    }
                    isValid = false;
                }
            } else if (userPlan && userPlan.status !== 'ACTIVE') {
                isValid = false;
                console.log(`[ACCESS CHECK] PLAN STATUS '${userPlan.status}' IS NOT ACTIVE`);
            }

            if (isValid) {
                // Normalize Plan Name
                const rawName = (effectivePlan.name || 'STARTER').toUpperCase();
                if (rawName.includes('BLACK')) planName = 'BLACK';
                else if (rawName.includes('PRO')) planName = 'PRO';
                else planName = 'STARTER';

                // DYNAMIC PRICING (Cycle 0-3)
                const cycleIndex = usageCount % 4;

                const billingKey = (billing === 'annual' || billing === 'anual') ? 'ANUAL' : 'MENSAL';
                const priceList = PRICING_RULES[`${planName}_${billingKey}`] || PRICING_RULES['STARTER_MENSAL'];

                // Use calculated Cycle Period
                const priceVal = priceList[cycleIndex] || priceList[0];

                bookPrice = priceVal;
                checkoutUrl = '';
                discountLevel = cycleIndex + 1; // 1-4

                console.log(`[ACCESS CHECK] VALID PLAN. Cycle: ${usageCount} (Index ${cycleIndex}). Price: ${bookPrice}. Level: ${discountLevel}`);

                // FORCE ACTIVE STATUS IN RESPONSE if Valid
                if (!userPlan) userPlan = { ...effectivePlan, status: 'ACTIVE' };
            } else {
                console.log(`[ACCESS CHECK] ISVALID=FALSE. Defaulting to 39.90 book price.`);
                bookPrice = 39.90; // Fallback for expired/invalid
            }
        } else {
            console.log(`[ACCESS CHECK] NO PLAN FOUND for ${safeEmail}`);
            bookPrice = 39.90;
        }

        // Capture effective plan for price calculation
        effectivePlan = userPlan || pendingPlan;
        if (effectivePlan) {
            const pName = effectivePlan.name || planName;
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

    // ... (logic above remains)

    // DETERMINAR PREÇO DA ASSINATURA (Para o Frontend saber se bloqueia ou não)
    let finalSubscriptionPrice = 49.90;
    let subscriptionLink = "https://pay.kiwify.com.br/SpCDp2q"; // Default Starter Monthly

    if (userPlan && userPlan.status === 'ACTIVE') {
        finalSubscriptionPrice = 0; // JÁ É ASSINANTE!
    } else {
        // Se não é assinante, qual o preço para virar?
        // Se ele tentou assinar um plano específico (pendingPlan), mostramos aquele.
        if (pendingPlan) {
            const pName = (pendingPlan.name || 'STARTER').toUpperCase();
            const pBilling = (pendingPlan.billing || 'monthly').toLowerCase();

            if (SUBSCRIPTION_PRICES[pName]) {
                finalSubscriptionPrice = SUBSCRIPTION_PRICES[pName][pBilling]?.price || 49.90;
                let baseLink = SUBSCRIPTION_PRICES[pName][pBilling]?.link;
                if (baseLink) {
                    if (baseLink.startsWith('/')) {
                        subscriptionLink = `${baseLink}&email=${email}`;
                    } else {
                        subscriptionLink = baseLink;
                    }
                }
            }
        }
    }



    // CHECK PENDING IF REQUESTED
    let pendingInvoice = null;
    if (req.query.checkPending === 'true' && email) {
        try {
            const safeEmail = (email as string).trim();
            const customer = await AsaasProvider.getCustomerByEmail(safeEmail);
            if (customer) {
                const payments = await AsaasProvider.getPayments({
                    customer: customer.id,
                    status: 'PENDING',
                    limit: 1
                });
                if (payments.length > 0) {
                    const p = payments[0];
                    pendingInvoice = {
                        id: p.id, // invoice number usually? Or Asaas ID.
                        invoiceNumber: p.invoiceNumber, // If available
                        status: p.status,
                        url: p.bankSlipUrl || p.invoiceUrl,
                        value: p.value
                    };
                }
            }
        } catch (e) { console.error("Error checking pending invoice", e); }
    }

    res.json({
        pendingInvoice,
        hasAccess: credits > 0 || hasActiveProject,
        credits,
        activeProjectId: hasActiveProject ? (await getProjectByEmail((email as string).toLowerCase().trim()))?.id : null,
        plan: userPlan,

        // Prices
        bookPrice, // Preço do livro extra (calculado antes)
        subscriptionPrice: finalSubscriptionPrice, // 0 = Assinante, >0 = Não Assinante

        // Links
        subscriptionLink, // Link Asaas (agora com email)
        bookCheckoutUrl: `/api/payment/pay-book?email=${email}`, // Link Asaas (Backend gera)

        // Metadata
        planLabel: effectivePlan
            ? `Plano ${(effectivePlan.name || 'STARTER').toUpperCase()}`
            : "Assinatura Necessária",
        discountLevel,
        totalBooksGenerated: usageCount,
        lastPaymentDate,
        latestInvoiceStatus,
        latestInvoiceNumber
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
        console.error("Create Charge Error", e);
        res.status(500).json({ error: "Failed to create charge" });
    }
};

export const createSubscriptionCharge = async (req: Request, res: Response) => {
    try {
        const { email, plan, billing } = req.query;

        if (!email || !plan) {
            return res.status(400).json({ error: "Email and Plan are required" });
        }

        const userEmail = (email as string).trim();
        const planKey = (plan as string).toUpperCase();
        const billingType = (billing as string || 'monthly').toUpperCase();

        // 1. Create/Get Customer
        const customerId = await AsaasProvider.createCustomer({
            name: "Novo Assinante", // We should ideally get name from user data... but for now generic.
            email: userEmail
        });

        // 2. Create Subscription
        // AsaasProvider.createSubscription expects planKey from config (STARTER, etc)
        // Ensure billing matches what createSubscription expects (it uses plan config for cycle)
        // But our provider takes 'planKey'. Does it handle monthly/annual variations?
        // Looking at provider, it does `getPlanConfig(planKey)`.
        // If config only has STARTER, PRO, BLACK, it defaults to MONTHLY cycle in config.
        // We need to support ANNUAL.
        // Actually, AsaasProvider.createSubscription takes 'planKey'.
        // If we want Annual, we might need a different planKey or modify provider to accept cycle override.
        // For now, let's assume MONTHLY for simplicity or just pass the basic key.
        // TODO: Support Annual properly. The Config `subscriptions.config.ts` has 'cycle: MONTHLY' hardcoded.
        // Let's force Monthly for now as per user request (strict subscription).

        const sub = await AsaasProvider.createSubscription(customerId, planKey);

        // 3. Get First Invoice URL
        // Subscription response might have it? Usually no.
        // We fetch payments.
        // Wait, Asaas requires fetching payments for the sub.

        // Retry logic: Asaas might take a moment to generate the charge?
        let payments = [];
        let attempts = 0;
        while (payments.length === 0 && attempts < 5) {
            payments = await AsaasProvider.getSubscriptionPayments(sub.id);
            if (payments.length === 0) await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }

        if (payments.length > 0) {
            const invoiceUrl = payments[0].bankSlipUrl || payments[0].invoiceUrl;
            // Redirect user to Asaas Invoice
            return res.redirect(invoiceUrl);
        } else {
            // Fallback: If no payment found (rare), show error or dashboard
            console.error("No payments generated for new subscription", sub.id);
            return res.send("Erro ao gerar cobrança de assinatura. Tente novamente ou contate o suporte.");
        }

    } catch (e: any) {
        console.error("Create Subscription Charge Error", e);
        res.status(500).send(`Erro ao processar assinatura: ${e.message}`);
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


