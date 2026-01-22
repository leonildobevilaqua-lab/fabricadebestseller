import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AsaasProvider } from '../services/asaas.provider';
import { PLANS } from '../config/subscriptions.config';
import { getVal, setVal, pushVal, reloadDB } from '../services/db.service';

const findLeadIndex = (leads: any[], email: string) => {
    return leads.findIndex((l: any) => l.email?.toLowerCase().trim() === email.toLowerCase().trim());
};

export const SubscriptionController = {
    async create(req: Request, res: Response) {
        const { email, name, cpfCnpj, phone, planKey, creditCard, address } = req.body;

        try {
            await reloadDB();
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            let leadIndex = findLeadIndex(leads, email);
            let lead: any;

            if (leadIndex !== -1) {
                lead = leads[leadIndex];
            } else {
                console.log(`[SUBSCRIBE] User ${email} not found. Creating new lead.`);
                lead = {
                    id: uuidv4(),
                    email,
                    name: name || 'Novo Usuário',
                    phone: phone || '',
                    status: 'PENDING',
                    created_at: new Date()
                };
            }

            // 1. Create Customer (with Address)
            const customerId = await AsaasProvider.createCustomer({
                name: name || lead.name,
                email,
                cpfCnpj,
                phone,
                postalCode: address?.cep,
                address: address?.street,
                addressNumber: address?.number,
                complement: address?.complement,
                province: address?.neighborhood,
                // city/state handled by CEP usually, but Asaas doesn't ask for them explicitly in simple payload?
                // Actually Asaas works best with just CEP + Number.
            });

            // 2. Create Subscription
            const subscription = await AsaasProvider.createSubscription(customerId, planKey, creditCard);

            // 3. Save to DB
            const planConfig = (PLANS as any)[planKey];

            const updatedLead = {
                ...lead,
                asaas_customer_id: customerId,
                asaas_subscription_id: subscription.id,
                plan: {
                    name: planKey,
                    status: 'PENDING',
                    startDate: new Date(),
                    subscriptionId: subscription.id,
                    features: planConfig.features,
                    billing: 'monthly'
                },
                status: 'SUBSCRIBER_PENDING'
            };

            if (leadIndex !== -1) {
                await setVal(`/leads[${leadIndex}]`, updatedLead);
            } else {
                await pushVal('/leads', updatedLead);
            }

            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            await setVal(`/users/${safeEmail}/plan`, updatedLead.plan);

            // Fetch Payment Link
            const payments = await AsaasProvider.getSubscriptionPayments(subscription.id);
            const invoiceUrl = payments?.[0]?.invoiceUrl || payments?.[0]?.bankSlipUrl;

            res.json({ success: true, subscription, invoiceUrl });

        } catch (error: any) {
            console.error("Subscribe Error", error);
            res.status(500).json({ error: error.response?.data?.errors?.[0]?.description || error.message });
        }
    },

    async changePlan(req: Request, res: Response) {
        const { email, newPlanKey } = req.body;

        try {
            await reloadDB();
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            let leadIndex = findLeadIndex(leads, email);
            if (leadIndex === -1) return res.status(404).json({ error: "User not found" });

            const lead = leads[leadIndex];
            const subId = lead.asaas_subscription_id;

            if (!subId) return res.status(400).json({ error: "No active subscription found" });

            // Call Asaas
            const result = await AsaasProvider.updateSubscription(subId, newPlanKey);

            // Update Local
            const planConfig = (PLANS as any)[newPlanKey];

            const updatedPlan = {
                ...lead.plan,
                name: newPlanKey,
                features: planConfig.features,
                billing: 'monthly'
            };

            await setVal(`/leads[${leadIndex}]/plan`, updatedPlan);
            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            await setVal(`/users/${safeEmail}/plan`, updatedPlan);

            res.json({ success: true, result });
        } catch (error: any) {
            res.status(500).json({ error: error.response?.data?.errors?.[0]?.description || error.message });
        }
    },

    async webhook(req: Request, res: Response) {
        const token = req.headers['asaas-access-token'] || req.body.authToken; // Asaas sends in header or body depending on version
        const EXPECTED = process.env.ASAAS_WEBHOOK_TOKEN || 'FabricaAsaas2026';

        if (token !== EXPECTED) {
            console.warn(`[WEBHOOK] Invalid Token: ${token} vs ${EXPECTED}`);
            return res.status(401).json({ error: "Unauthorized" });
        }

        const event = req.body;
        console.log("Asaas Webhook Event:", event.event);

        // Handle Status Updates
        if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
            const payment = event.payment;
            const subId = payment.subscription;
            // const email = payment.billingType === 'PIX' ? payment.customer : null; // Unused for now

            if (subId) {
                console.log(`[WEBHOOK] Subscription Payment ${subId} Confirmed!`);
                await reloadDB();
                const rawLeads = await getVal('/leads') || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

                const leadIndex = leads.findIndex((l: any) => l.asaas_subscription_id === subId);
                if (leadIndex !== -1) {
                    const lead = leads[leadIndex];
                    console.log(`[WEBHOOK] Activating Plan for ${lead.email}`);

                    const updatedLead = {
                        ...lead,
                        plan: { ...lead.plan, status: 'ACTIVE', lastPayment: new Date() },
                        status: 'SUBSCRIBER'
                    };
                    await setVal(`/leads[${leadIndex}]`, updatedLead);
                    const safeEmail = lead.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                    await setVal(`/users/${safeEmail}/plan`, updatedLead.plan);
                }
            } else {
                // One-off Payment?
                console.log(`[WEBHOOK] One-off Payment ${payment.id} Confirmed!`);
                // Use payment.customer to find user if needed
            }
        }

        res.json({ received: true });
    }
};
