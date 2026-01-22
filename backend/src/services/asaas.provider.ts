import axios from 'axios';
import { PLANS } from '../config/subscriptions.config';
import dotenv from 'dotenv';

dotenv.config();

const ASAAS_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

const getApi = () => {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) throw new Error("ASAAS_API_KEY is not configured in .env");

    return axios.create({
        baseURL: ASAAS_URL,
        headers: {
            'access_token': apiKey,
            'Content-Type': 'application/json'
        }
    });
};

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
            const { data } = await getApi().get(`/customers?email=${user.email}`);
            if (data.data && data.data.length > 0) {
                return data.data[0].id; // Return existing ID
            }
        } catch (e) { console.error("Error searching customer", e); }

        // Create new
        try {
            const payload: any = {
                name: user.name,
                email: user.email
            };

            if (user.cpfCnpj && user.cpfCnpj.trim() !== '') payload.cpfCnpj = user.cpfCnpj;
            if (user.phone && user.phone.trim() !== '') payload.mobilePhone = user.phone;

            const { data } = await getApi().post('/customers', payload);
            return data.id;
        } catch (error: any) {
            const errorMsg = error.response?.data?.errors?.[0]?.description || error.message;
            console.error("Asaas Create Customer Error:", error.response?.data || error.message);
            throw new Error(`Failed to create customer in Asaas: ${errorMsg}`);
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
            const { data } = await getApi().post('/subscriptions', payload);
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
            const { data } = await getApi().post(`/subscriptions/${subscriptionId}`, payload);
            return data;
        } catch (error: any) {
            console.error("Asaas Update Subscription Error:", error.response?.data || error.message);
            throw error;
        }
    },

    async getSubscription(subscriptionId: string) {
        try {
            const { data } = await getApi().get(`/subscriptions/${subscriptionId}`);
            return data;
        } catch (error: any) {
            return null;
        }
    },

    async getSubscriptionPayments(subscriptionId: string) {
        try {
            const { data } = await getApi().get(`/subscriptions/${subscriptionId}/payments`);
            return data.data; // Array of payments
        } catch (error: any) {
            console.error("Error fetching sub payments", error);
            return [];
        }
    },

    async createPayment(customerId: string, value: number, description: string) {
        try {
            // Create one-off payment
            const payload = {
                customer: customerId,
                billingType: 'UNDEFINED', // Let user choose in Asaas Invoice
                value: value,
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days expiry
                description: description
            };
            const { data } = await getApi().post('/payments', payload);
            return data;
        } catch (error: any) {
            console.error("Create Payment Error", error.response?.data || error.message);
            throw error;
        }
    }
};
