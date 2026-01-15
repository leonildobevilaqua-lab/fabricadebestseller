import { Request, Response } from 'express';
import { setVal, getVal, pushVal } from '../services/db.service';

// Store a lead when user fills the form
export const createLead = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, countryCode } = req.body;
        // Create a unique ID or use email
        const id = new Date().getTime().toString();
        const lead = {
            id,
            name,
            email,
            phone,
            fullPhone: `${countryCode}${phone}`,
            status: 'PENDING',
            date: new Date()
        };
        await pushVal('/leads', lead);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Error saving lead" });
    }
};

// Get all leads for admin
export const getLeads = async (req: Request, res: Response) => {
    try {
        const leads = await getVal('/leads') || {};
        // Convert object to array if needed, node-json-db might return array or object depending on push usage
        // pushVal creates an array usually.
        res.json(leads);
    } catch (e) {
        res.json([]);
    }
};

// Approve a lead (Grant free access)
export const approveLead = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const safeEmail = email.replace(/\./g, '_');

        // Grant Credit
        const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
        await setVal(`/credits/${safeEmail}`, currentCredits + 1);

        // Update Lead Status (Optional, finding the specific lead in JSON DB array is tricky without index, 
        // effectively we just care about credits for access)

        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Error approving" });
    }
};

// ... existing handler methods ...
export const handleKiwifyWebhook = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        console.log("Kiwify Webhook Received:", JSON.stringify(payload));

        const status = payload.order_status;
        const email = payload.Customer?.email || payload.customer?.email;

        if (status === 'paid' && email) {
            console.log(`Payment confirmed for ${email}`);
            await pushVal('/orders', { ...payload, date: new Date() });
            const currentCredits = Number((await getVal(`/credits/${email.replace(/\./g, '_')}`)) || 0);
            await setVal(`/credits/${email.replace(/\./g, '_')}`, currentCredits + 1);
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

    const safeEmail = (email as string).replace(/\./g, '_');
    const bypass = await getVal('/settings/payment_bypass');
    if (bypass) return res.json({ hasAccess: true, credits: 999 });

    const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

    res.json({ hasAccess: credits > 0, credits });
};

export const useCredit = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const safeEmail = (email as string).replace(/\./g, '_');
    const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

    if (credits > 0) {
        await setVal(`/credits/${safeEmail}`, credits - 1);
        return res.json({ success: true, remaining: credits - 1 });
    } else {
        return res.status(403).json({ error: "No credits available" });
    }
};
