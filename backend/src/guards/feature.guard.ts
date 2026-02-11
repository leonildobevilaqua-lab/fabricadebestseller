import { getVal, reloadDB } from '../services/db.service';
import { PLANS } from '../config/subscriptions.config';

export const checkFeature = async (email: string, feature: keyof typeof PLANS.STARTER.features): Promise<boolean> => {
    if (!email) return false;

    // Normalize email
    const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

    try {
        // Try getting from cache/db
        const userPlan = await getVal(`/users/${safeEmail}/plan`);

        // VIP Bypass
        if (email.includes('subevilaqua') || email.includes('admin')) return true;

        if (!userPlan) return false; // No plan

        // Check Status (Pending might not have access yet?)
        // Assuming ACTIVE or SUBSCRIBER
        /* 
        if (userPlan.status !== 'ACTIVE' && userPlan.status !== 'SUBSCRIBER') return false; 
        */

        // Check Feature
        const features = userPlan.features || {};
        return !!features[feature];

    } catch (e) {
        console.error("Feature Guard Error", e);
        return false;
    }
};

export const assertFeature = async (email: string, feature: keyof typeof PLANS.STARTER.features) => {
    const hasAccess = await checkFeature(email, feature);
    if (!hasAccess) throw new Error(`Funcionalidade bloqueada: Seu plano atual não permite '${feature}'. Faça um upgrade.`);
};
