
import { Request, Response } from 'express';
import { setVal, getVal } from '../services/db.service';

export const simulateWebhook = async (req: Request, res: Response) => {
    try {
        const { plan, billing, user } = req.body;

        if (!user || !user.email) {
            return res.status(400).json({ error: "User data required" });
        }

        const safeEmail = user.email.toLowerCase().trim().replace(/\./g, '_');

        // 1. Create/Update User Record with PENDING Plan
        await setVal(`/users/${safeEmail}/plan`, {
            name: plan,
            billing: billing,
            status: 'PENDING', // Waiting admin approval
            startDate: new Date(),
            simulated: true,
            paymentData: {
                payer: user.name,
                cpf: user.cpf,
                cardLast4: user.cardLast4
            }
        });

        // 2. Update the Lead Status if it exists
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        // Find specific lead or latest
        let leadIndex = -1;
        // Search backwards to match current flow
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email?.toLowerCase().trim() === user.email.toLowerCase().trim()) {
                leadIndex = i;
                break;
            }
        }

        if (leadIndex !== -1) {
            // Update the lead to reflect the PENDING plan
            await setVal(`/leads[${leadIndex}]/plan`, {
                name: plan,
                billing,
                status: 'PENDING'
            });
            await setVal(`/leads[${leadIndex}]/status`, 'SUBSCRIBER_PENDING');
            console.log(`Simulated Subscription for ${user.email}: ${plan} (${billing}) - Pending Approval`);
        } else {
            console.warn(`Simulated Subscription for ${user.email} but no Lead found.`);
        }

        res.json({ success: true, message: "Subscription Simulation Queued" });
    } catch (e: any) {
        console.error("Simulation Error:", e);
        res.status(500).json({ error: e.message });
    }
};
