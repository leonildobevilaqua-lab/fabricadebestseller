import axios from 'axios';
import { PLANS } from '../config/subscriptions.config';
import dotenv from 'dotenv';

// import path from 'path'; // Removed to simplify
// dotenv.config();

const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';
// HARDCODED KEY TO FIX URGENT ISSUE - ENV LOADING IS FAILING
const ASAAS_API_KEY_FIXED = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmRhYWMxM2M2LTUxNDYtNGZmZS1iOGVkLTZhN2M5YmEyOTg2NTo6JGFhY2hfZTgzMmQ4NTYtNDQ1NS00ZTM0LThiNzEtNjdiY2ZjNDMwZDVi';

const getApi = () => {
    return axios.create({
        baseURL: ASAAS_URL,
        headers: {
            'access_token': ASAAS_API_KEY_FIXED,
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
    async createCustomer(user: {
        name: string,
        email: string,
        cpfCnpj?: string,
        phone?: string,
        address?: string,
        addressNumber?: string,
        complement?: string,
        province?: string, // Bairro
        postalCode?: string // CEP
    }) {
        // First try to find existing
        try {
            const { data } = await getApi().get(`/customers?email=${user.email}`);
            if (data.data && data.data.length > 0) {
                const existingId = data.data[0].id;

                // UPDATE EXISTING CUSTOMER TO ENSURE CPF IS THERE
                try {
                    const updatePayload: any = {};
                    if (user.cpfCnpj) updatePayload.cpfCnpj = user.cpfCnpj;
                    if (user.phone) updatePayload.mobilePhone = user.phone;
                    if (user.postalCode) updatePayload.postalCode = user.postalCode;
                    if (user.address) updatePayload.address = user.address;
                    if (user.addressNumber) updatePayload.addressNumber = user.addressNumber;
                    if (user.complement) updatePayload.complement = user.complement;
                    if (user.province) updatePayload.province = user.province;

                    if (Object.keys(updatePayload).length > 0) {
                        await getApi().post(`/customers/${existingId}`, updatePayload);
                        console.log(`[ASAAS] Updated Existing Customer ${existingId}`);
                    }
                } catch (updErr: any) {
                    console.error("[ASAAS] Failed to update existing customer:", updErr.message);
                    // Continue anyway, maybe it was already correct
                }

                return existingId;
            }
        } catch (e) { console.error("Error searching customer", e); }

        // Create new
        try {
            const payload: any = {
                name: user.name,
                email: user.email
            };

            if (user.cpfCnpj && user.cpfCnpj.trim() !== '') {
                payload.cpfCnpj = user.cpfCnpj;
            }

            // Address Info
            if (user.postalCode) payload.postalCode = user.postalCode;
            if (user.address) payload.address = user.address;
            if (user.addressNumber) payload.addressNumber = user.addressNumber;
            if (user.complement) payload.complement = user.complement;
            if (user.province) payload.province = user.province;

            if (user.phone && user.phone.trim() !== '') payload.mobilePhone = user.phone;

            const { data } = await getApi().post('/customers', payload);
            return data.id;
        } catch (error: any) {
            let errorMsg = error.response?.data?.errors?.[0]?.description || error.message;
            // Removed deprecated hack for CPF retry

            console.error("Asaas Create Customer Error:", error.response?.data || error.message);
            throw new Error(`Failed to create customer in Asaas: ${errorMsg}`);
        }
    },

    async getCustomer(customerId: string) {
        try {
            const { data } = await getApi().get(`/customers/${customerId}`);
            return data;
        } catch (error: any) {
            console.error("Asaas Get Customer Error:", error.response?.data || error.message);
            throw error;
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
