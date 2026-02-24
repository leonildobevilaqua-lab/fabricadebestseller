
import { Request, Response } from 'express';
import { getVal, reloadDB } from '../services/db.service';
import { AsaasProvider } from '../services/asaas.provider';

// -----------------------------------------------------------------
// FONTE DA VERDADE — PREÇOS FIXOS TABELADOS (Mirror do payment.controller)
// -----------------------------------------------------------------
const PRICING_RULES: Record<string, number> = {
    'AVULSO': 89.90,
    'STARTER_MENSAL': 28.90,
    'STARTER_ANUAL': 24.90,
    'PRO_MENSAL': 18.90,
    'PRO_ANUAL': 14.90,
    'BLACK_MENSAL': 9.90,
    'BLACK_ANUAL': 8.90,
};

export const createBookCharge = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "Email required" });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
        await reloadDB();

        // 1. Determine User Plan
        let plan = await getVal(`/users/${safeEmail}/plan`);

        // Fallback to searching leads if no user plan
        if (!plan || plan.status !== 'ACTIVE') {
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            const subLead = leads.find((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                l.status === 'SUBSCRIBER'
            );
            if (subLead && subLead.plan && subLead.plan.status === 'ACTIVE') {
                plan = subLead.plan;
            } else {
                plan = null;
            }
        }

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

        // 2. Get Fixed Price
        const price: number = PRICING_RULES[planKey] ?? PRICING_RULES['AVULSO'];

        // 3. Create Asaas Charge
        const userProfile = await getVal(`/users/${safeEmail}/profile`) || {};
        const customerId = await AsaasProvider.createCustomer({
            name: userProfile.name || email.split('@')[0],
            email: email,
            cpfCnpj: userProfile.cpf || undefined,
            phone: userProfile.phone || undefined
        });

        // Create Payment
        const payment = await AsaasProvider.createPayment(
            customerId,
            price,
            `Geração de Livro - ${cleanPlan} (R$ ${price.toFixed(2)})`
        );

        console.log(`[PURCHASE] Created charge for ${email}: R$ ${price} (${payment.invoiceUrl})`);

        return res.json({
            success: true,
            invoiceUrl: payment.invoiceUrl,
            price: price,
            plan: cleanPlan
        });

    } catch (e: any) {
        console.error("Purchase Error:", e);
        return res.status(500).json({ error: e.message || "Failed to create charge" });
    }
};
