import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { setVal, getVal, pushVal } from '../services/db.service';

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

        // 2. Update the Lead Status if it exists, or Create if missing
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
            console.warn(`Simulated Subscription for ${user.email} but no Lead found. Creating new Lead...`);

            // Create a fresh lead for the simulation
            const newLead = {
                id: uuidv4(),
                email: user.email,
                name: user.name || 'Simulado',
                phone: user.phone || '',
                status: 'SUBSCRIBER_PENDING',
                plan: {
                    name: plan,
                    billing,
                    status: 'PENDING',
                    startDate: new Date(),
                    lastPayment: new Date()
                },
                paymentInfo: {
                    amount: 9790, // Generic Placeholder Value (will be fixed by admin or ignored)
                    method: 'credit_card',
                    status: 'paid'
                },
                date: new Date(),
                created_at: new Date(),
                simulated: true,
                type: 'SIMULATION_RECOVERY'
            };

            await pushVal('/leads', newLead);
            console.log("Created new Simulated Lead (Recovery).");
        }

        res.json({ success: true, message: "Subscription Simulation Queued" });
    } catch (e: any) {
        console.error("Simulation Error:", e);
        res.status(500).json({ error: e.message });
    }
};
