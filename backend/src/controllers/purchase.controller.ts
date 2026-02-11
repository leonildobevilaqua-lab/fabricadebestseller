
import { Request, Response } from 'express';
import { getVal, reloadDB } from '../services/db.service';
import { AsaasProvider } from '../services/asaas.provider';
import { v4 as uuidv4 } from 'uuid';

// Pricing Config (Copied/Mirrored for consistency)
const PRICING_CONFIG: any = {
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

export const createBookCharge = async (req: Request, res: Response) => {
    try {
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
        const payment = await AsaasProvider.createPayment(
            customerId,
            price,
            `Geração de Livro - ${finalPlanName} - Ciclo ${cycleIndex + 1}/4`
        );

        console.log(`[PURCHASE] Created charge for ${email}: ${price} (${payment.invoiceUrl})`);

        return res.json({
            success: true,
            invoiceUrl: payment.invoiceUrl,
            price: price,
            level: cycleIndex + 1
        });

    } catch (e: any) {
        console.error("Purchase Error:", e);
        return res.status(500).json({ error: e.message || "Failed to create charge" });
    }
};
