import axios from 'axios';
import { PLANS } from '../config/subscriptions.config';
import dotenv from 'dotenv';

dotenv.config();

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
const ASAAS_KEY = process.env.ASAAS_API_KEY || '';

const api = axios.create({
    baseURL: ASAAS_URL,
    headers: {
        'access_token': ASAAS_KEY,
        'Content-Type': 'application/json'
    }
});

// Helper to get Plan Config
const getPlanConfig = (planKey: string) => {
    const key = planKey.toUpperCase();
    return (PLANS as any)[key] || null;
};

export const AsaasProvider = {
    // 1. Create/Get Customer
    async createCustomer(user: { name: string, email: string, cpfCnpj?: string, phone?: string }) {
        // First try to find existing
        try {
            const { data } = await api.get(`/customers?email=${user.email}`);
            if (data.data && data.data.length > 0) {
                return data.data[0].id; // Return existing ID
            }
        } catch (e) { console.error("Error searching customer", e); }

        // Create new
        try {
            const payload = {
                name: user.name,
                email: user.email,
                cpfCnpj: user.cpfCnpj,
                mobilePhone: user.phone
            };
            const { data } = await api.post('/customers', payload);
            return data.id;
        } catch (error: any) {
            console.error("Asaas Create Customer Error:", error.response?.data || error.message);
            throw new Error("Failed to create customer in Asaas");
        }
    },

    // 2. Create Subscription
    async createSubscription(customerId: string, planKey: string, creditCard?: any) {
        const plan = getPlanConfig(planKey);
        if (!plan) throw new Error("Invalid Plan");

        const payload: any = {
            customer: customerId,
            billingType: creditCard ? 'CREDIT_CARD' : 'UNDEFINED', // Or PIX/BOLETO
            value: plan.price,
            nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow? Or today? Asaas usually requires future date for boleto? For CC it can be immediate? 
            // For SaaS usually immediate charge.
            cycle: plan.cycle, // 'MONTHLY'
            description: `Assinatura Plano ${plan.name}`
        };

        if (creditCard) {
            payload.creditCard = creditCard;
            payload.billingType = 'CREDIT_CARD';
        } else {
            // Default to PIX/BOLETO link if no card?
            payload.billingType = 'UNDEFINED';
        }

        try {
            const { data } = await api.post('/subscriptions', payload);
            return data;
        } catch (error: any) {
            console.error("Asaas Create Subscription Error:", error.response?.data || error.message);
            throw error; // Let controller handle
        }
    },

    // 3. Update Subscription (Upgrade/Downgrade)
    async updateSubscription(subscriptionId: string, newPlanKey: string) {
        const plan = getPlanConfig(newPlanKey);
        if (!plan) throw new Error("Invalid Plan");

        const payload = {
            value: plan.price,
            cycle: plan.cycle,
            updatePendingPayments: true // Update future charges
        };

        try {
            const { data } = await api.post(`/subscriptions/${subscriptionId}`, payload);
            return data;
        } catch (error: any) {
            console.error("Asaas Update Subscription Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async getSubscription(subscriptionId: string) {
        try {
            const { data } = await api.get(`/subscriptions/${subscriptionId}`);
            return data;
        } catch (error: any) {
            return null;
        }
    }
};
