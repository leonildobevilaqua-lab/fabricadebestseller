import axios from 'axios';
import { PLANS } from '../config/subscriptions.config';
import dotenv from 'dotenv';

dotenv.config();

const PRODUCTION_URL = 'https://api.asaas.com/v3';
const SANDBOX_URL = 'https://sandbox.asaas.com/api/v3';

// Detecta o ambiente atual (sandbox ou production)
export const getAsaasEnv = (): 'sandbox' | 'production' => {
    const env = (process.env.ASAAS_ENV || 'sandbox').toLowerCase();
    return env === 'production' ? 'production' : 'sandbox';
};

// URL baseada no ambiente
const getAsaasUrl = (): string => {
    return getAsaasEnv() === 'production' ? PRODUCTION_URL : SANDBOX_URL;
};

// Chave baseada no ambiente — usa ASAAS_SANDBOX_KEY ou ASAAS_PRODUCTION_KEY
// Mantém compatibilidade com ASAAS_API_KEY legado
const getAsaasKey = (): string => {
    const env = getAsaasEnv();
    if (env === 'production') {
        const prodKey = process.env.ASAAS_PRODUCTION_KEY || process.env.ASAAS_API_KEY;
        if (prodKey) return prodKey;
        console.error('[ASAAS] ❌ ASAAS_PRODUCTION_KEY não configurada! Configure no Coolify.');
        throw new Error('ASAAS_PRODUCTION_KEY não configurada. Configure esta variável no seu servidor.');
    } else {
        const sandboxKey = process.env.ASAAS_SANDBOX_KEY || process.env.ASAAS_API_KEY;
        if (sandboxKey) return sandboxKey;
        console.error('[ASAAS] ❌ ASAAS_SANDBOX_KEY não configurada!');
        throw new Error('ASAAS_SANDBOX_KEY não configurada.');
    }
};

// Token de validação do Webhook
export const getAsaasWebhookToken = (): string => {
    const env = getAsaasEnv();
    if (env === 'production') {
        return process.env.ASAAS_PRODUCTION_WEBHOOK || process.env.ASAAS_WEBHOOK_TOKEN || '';
    }
    return process.env.ASAAS_SANDBOX_WEBHOOK || process.env.ASAAS_WEBHOOK_TOKEN || '';
};

const getApi = () => {
    const url = getAsaasUrl();
    const key = getAsaasKey(); // Pode lançar erro se chave não configurada
    const env = getAsaasEnv().toUpperCase();
    console.log(`[ASAAS] Ambiente: ${env} | URL: ${url}`);
    return axios.create({
        baseURL: url,
        headers: {
            'access_token': key,
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
    async createSubscription(customerId: string, planKey: string, billing: 'monthly' | 'annual' = 'monthly', creditCard?: any) {
        const plan = getPlanConfig(planKey);
        if (!plan) throw new Error("Invalid Plan");

        const isAnnual = billing === 'annual';
        const value = isAnnual ? plan.annual.price : plan.monthly.price;
        const cycle = isAnnual ? 'YEARLY' : 'MONTHLY';

        const payload: any = {
            customer: customerId,
            billingType: creditCard ? 'CREDIT_CARD' : 'UNDEFINED',
            value,
            nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            cycle,
            description: `Assinatura Plano ${plan.name} ${isAnnual ? 'Anual' : 'Mensal'}`
        };

        if (creditCard) {
            payload.creditCard = creditCard;
            payload.billingType = 'CREDIT_CARD';
        } else {
            payload.billingType = 'UNDEFINED';
        }

        try {
            const { data } = await getApi().post('/subscriptions', payload);
            return data;
        } catch (error: any) {
            console.error("Asaas Create Subscription Error:", error.response?.data || error.message);
            throw error;
        }
    },

    // 3. Update Subscription (Upgrade/Downgrade)
    async updateSubscription(subscriptionId: string, newPlanKey: string, billing: 'monthly' | 'annual' = 'monthly') {
        const plan = getPlanConfig(newPlanKey);
        if (!plan) throw new Error("Invalid Plan");

        const value = billing === 'annual' ? plan.annual.price : plan.monthly.price;
        const payload = {
            value,
            cycle: billing === 'annual' ? 'YEARLY' : 'MONTHLY',
            updatePendingPayments: true
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
    },

    async getCustomerByEmail(email: string) {
        try {
            const { data } = await getApi().get(`/customers?email=${email}`);
            if (data.data && data.data.length > 0) return data.data[0];
            return null;
        } catch (error) { return null; }
    },

    async getPayments(params: any) {
        try {
            // params: { customer, status, dateAfter, etc }
            const qs = new URLSearchParams(params).toString();
            const { data } = await getApi().get(`/payments?${qs}`);
            return data.data || [];
        } catch (error: any) {
            console.error("Asaas Get Payments Error", error.message);
            return [];
        }
    }
};
