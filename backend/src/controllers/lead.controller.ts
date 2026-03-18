import { Request, Response } from 'express';
import { pushVal } from '../services/db.service';

/**
 * LEAD CONTROLLER
 * Handles lead capture for landing pages
 */
export const LeadController = {
    async registerLeads(req: Request, res: Response) {
        try {
            const { name, email, phone, source } = req.body;

            if (!email) {
                return res.status(400).json({ error: "E-mail é obrigatório." });
            }

            const lead = {
                name: name || "Visitante",
                email: email.toLowerCase().trim(),
                phone: phone || "",
                source: source || "landing_page_promocao",
                date: new Date().toISOString()
            };

            // Save to /leads collection
            await pushVal('/leads', lead);

            console.log(`[LEAD] Novo lead capturado: ${lead.email} (${lead.source})`);

            return res.json({ 
                success: true, 
                message: "Lead registrado com sucesso" 
            });

        } catch (e) {
            console.error("[LEAD_ERROR]", e);
            return res.status(500).json({ error: "Falha ao registrar lead" });
        }
    }
};
