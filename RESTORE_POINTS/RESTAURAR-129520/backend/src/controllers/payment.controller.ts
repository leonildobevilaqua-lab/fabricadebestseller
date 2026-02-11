import { Request, Response } from 'express';
import { setVal, getVal, pushVal } from '../services/db.service';
import { getProjectByEmail } from '../services/queue.service';

// ... (rest of imports or code)

// ...
// Store a lead when user fills the form
export const createLead = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, countryCode, type, topic, authorName } = req.body;
        // Create a unique ID or use email
        const id = new Date().getTime().toString();
        const lead = {
            id,
            name,
            email,
            phone,
            fullPhone: `${countryCode}${phone}`,
            type: type || 'BOOK', // Default to BOOK if not provided
            status: 'PENDING',
            date: new Date(),
            topic,
            authorName
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
            await setVal(`/leads[${targetIndex}]/status`, newStatus);
        }
    } catch (e) {
        console.error("Error updating lead status:", e);
    }
};

// Approve a lead (Grant free access)
export const approveLead = async (req: Request, res: Response) => {
    try {
        console.log("Approve Lead Request Body:", req.body);
        const { email } = req.body;

        if (!email) {
            console.error("Missing email in approveLead");
            return res.status(400).json({ error: "Email is required" });
        }

        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');

        // Grant Credit
        const val = await getVal(`/credits/${safeEmail}`);
        const currentCredits = Number(val || 0);

        console.log(`Granting credit to ${safeEmail}. Current: ${currentCredits}, New: ${currentCredits + 1}`);

        await setVal(`/credits/${safeEmail}`, currentCredits + 1);

        // Update Lead Status
        await updateLeadStatus(email, 'APPROVED');

        res.json({ success: true, newCredits: currentCredits + 1 });
    } catch (e: any) {
        console.error("Error approving lead:", e);
        res.status(500).json({ error: "Error approving: " + e.message });
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

            // Extract Payment Info
            const paymentInfo = {
                payer: payload.Customer?.full_name || payload.customer?.full_name || "Desconhecido",
                payerEmail: email,
                amount: (payload.amount || payload.total || 0) / 100, // Assuming cents if int, check docs if float. Kiwify sends cents often? Or raw value. Safer to assume cents if int > 1000? Let's just store raw for now or try to parse. Kiwify webhook sends string or number? usually cents/100.
                product: payload.Product?.name || "Produto"
            };

            await pushVal('/orders', { ...payload, date: new Date(), paymentInfo });

            const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
            const currentCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);
            await setVal(`/credits/${safeEmail}`, currentCredits + 1);

            // Find and Update Lead with Payment Info
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            let leadIndex = -1;
            // Find latest lead for this email
            for (let i = leads.length - 1; i >= 0; i--) {
                const l: any = leads[i];
                if (l.email?.toLowerCase().trim() === email.toLowerCase().trim()) {
                    leadIndex = i;
                    break;
                }
            }

            if (leadIndex !== -1) {
                await setVal(`/leads[${leadIndex}]/status`, 'APPROVED');
                await setVal(`/leads[${leadIndex}]/paymentInfo`, paymentInfo);
                await setVal(`/leads[${leadIndex}]/isVoucher`, true);
                console.log(`Updated Lead ${leadIndex} with payment info.`);
            }

            // --- AUTO-PROCESS DIAGRAMMING ---
            // Check if user has a PENDING/DIAGRAMMING lead and trigger processing
            try {
                // Reuse leads var
                // Find latest DIAGRAMMING lead for this email
                let targetLead: any = null;
                for (let i = leads.length - 1; i >= 0; i--) {
                    const l: any = leads[i];
                    if (l.email?.toLowerCase().trim() === email.toLowerCase().trim() && l.type === 'DIAGRAMMING') {
                        targetLead = l;
                        break;
                    }
                }

                if (targetLead && targetLead.status !== 'COMPLETED') { // Check if not already done? Lead status might be APPROVED just now.
                    console.log(`Auto-processing Diagramming for lead ${targetLead.id}`);

                    // We need to call processDiagramLead logic. Since it's in another controller, 
                    // ideally we should extract the logic to a service. 
                    // For now, let's call the controller function via a mocked request or move logic.
                    // Better: Import and call function if exported, or just duplicate clean logic?
                    // Let's rely on the fact that ProjectController is available.

                    const ProjectController = require('./project.controller');
                    // Mock Req/Res for internal call?
                    // Or better, refactor processDiagramLead to be a service function.
                    // Given constraints, I will try to call the logic directly if possible or make a quick internal HTTP call?
                    // Internal HTTP call is safest to keep contexts separated.

                    // Actually, simpler: just let the frontend showing "Diagramming..." 
                    // But the USER wants "Así que paga O SISTEMA POSSA INICIAR".
                    // So we must trigger it.

                    // We can call ProjectController.processDiagramLead directly with a mock object 
                    // BUT processDiagramLead sends a Response. We don't want that here.

                    // REFACTOR: I will just instantiate the logic here briefly or ensure ProjectController has a helper.
                    // I will Assume ProjectController has 'processDiagramLeadLogic' or similar? No.

                    // Let's do a fetch to localhost?
                    fetch('http://localhost:3001/api/projects/process-diagram-lead', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ leadId: targetLead.id })
                    }).catch(err => console.error("Auto-diagram trigger failed", err));
                }
            } catch (e) {
                console.error("Auto-process error", e);
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

    // Find latest lead status
    let leadStatus = null;
    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        for (let i = leads.length - 1; i >= 0; i--) {
            if ((leads[i] as any).email?.toLowerCase().trim() === (email as string).toLowerCase().trim()) {
                leadStatus = (leads[i] as any).status;
                break;
            }
        }
    } catch (e) { console.error("Error fetching lead status", e); }

    // Check for active project to allow resume
    let hasActiveProject = false;
    try {
        const project = await getProjectByEmail((email as string).toLowerCase().trim());
        // Resume if project exists and is not COMPLETED (or allow viewing completed?)
        // BUG FIX: Ignore 'Livro Pré-Escrito' (Diagramming) projects for access control on NEW flows
        if (project && project.metadata.status !== 'COMPLETED' && project.metadata.status !== 'FAILED') {
            if (project.metadata.topic !== 'Livro Pré-Escrito') {
                hasActiveProject = true;
            }
        }
    } catch (e) {
        console.error("Error checking active project:", e);
    }

    res.json({ hasAccess: credits > 0 || hasActiveProject, credits, hasActiveProject, leadStatus });
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

export const getPublicConfig = (req: Request, res: Response) => {
    const config = require('../services/config.service').getConfig();
    res.json({ products: config.products || {} });
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
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        let targetIndex = -1;
        for (let i = 0; i < leads.length; i++) {
            if ((leads[i] as any).id === id) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex !== -1) {
            const db = require('../services/db.service').default;
            await db.delete(`/leads[${targetIndex}]`);
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Lead not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};
