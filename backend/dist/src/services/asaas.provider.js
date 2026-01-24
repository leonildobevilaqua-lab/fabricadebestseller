"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsaasProvider = void 0;
const axios_1 = __importDefault(require("axios"));
const subscriptions_config_1 = require("../config/subscriptions.config");
// import path from 'path'; // Removed to simplify
// dotenv.config();
const ASAAS_URL = 'https://sandbox.asaas.com/api/v3';
// HARDCODED KEY TO FIX URGENT ISSUE - ENV LOADING IS FAILING
const ASAAS_API_KEY_FIXED = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmRhYWMxM2M2LTUxNDYtNGZmZS1iOGVkLTZhN2M5YmEyOTg2NTo6JGFhY2hfZTgzMmQ4NTYtNDQ1NS00ZTM0LThiNzEtNjdiY2ZjNDMwZDVi';
const getApi = () => {
    return axios_1.default.create({
        baseURL: ASAAS_URL,
        headers: {
            'access_token': ASAAS_API_KEY_FIXED,
            'Content-Type': 'application/json'
        }
    });
};
// Helper to get Plan Config
const getPlanConfig = (planKey) => {
    const key = planKey.toUpperCase();
    return subscriptions_config_1.PLANS[key] || null;
};
exports.AsaasProvider = {
    // 1. Create/Get Customer
    createCustomer(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            // First try to find existing
            try {
                const { data } = yield getApi().get(`/customers?email=${user.email}`);
                if (data.data && data.data.length > 0) {
                    const existingId = data.data[0].id;
                    // UPDATE EXISTING CUSTOMER TO ENSURE CPF IS THERE
                    try {
                        const updatePayload = {};
                        if (user.cpfCnpj)
                            updatePayload.cpfCnpj = user.cpfCnpj;
                        if (user.phone)
                            updatePayload.mobilePhone = user.phone;
                        if (user.postalCode)
                            updatePayload.postalCode = user.postalCode;
                        if (user.address)
                            updatePayload.address = user.address;
                        if (user.addressNumber)
                            updatePayload.addressNumber = user.addressNumber;
                        if (user.complement)
                            updatePayload.complement = user.complement;
                        if (user.province)
                            updatePayload.province = user.province;
                        if (Object.keys(updatePayload).length > 0) {
                            yield getApi().post(`/customers/${existingId}`, updatePayload);
                            console.log(`[ASAAS] Updated Existing Customer ${existingId}`);
                        }
                    }
                    catch (updErr) {
                        console.error("[ASAAS] Failed to update existing customer:", updErr.message);
                        // Continue anyway, maybe it was already correct
                    }
                    return existingId;
                }
            }
            catch (e) {
                console.error("Error searching customer", e);
            }
            // Create new
            try {
                const payload = {
                    name: user.name,
                    email: user.email
                };
                if (user.cpfCnpj && user.cpfCnpj.trim() !== '') {
                    payload.cpfCnpj = user.cpfCnpj;
                }
                // Address Info
                if (user.postalCode)
                    payload.postalCode = user.postalCode;
                if (user.address)
                    payload.address = user.address;
                if (user.addressNumber)
                    payload.addressNumber = user.addressNumber;
                if (user.complement)
                    payload.complement = user.complement;
                if (user.province)
                    payload.province = user.province;
                if (user.phone && user.phone.trim() !== '')
                    payload.mobilePhone = user.phone;
                const { data } = yield getApi().post('/customers', payload);
                return data.id;
            }
            catch (error) {
                let errorMsg = ((_d = (_c = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.description) || error.message;
                // Removed deprecated hack for CPF retry
                console.error("Asaas Create Customer Error:", ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message);
                throw new Error(`Failed to create customer in Asaas: ${errorMsg}`);
            }
        });
    },
    getCustomer(customerId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { data } = yield getApi().get(`/customers/${customerId}`);
                return data;
            }
            catch (error) {
                console.error("Asaas Get Customer Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    },
    // 2. Create Subscription
    createSubscription(customerId, planKey, creditCard) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const plan = getPlanConfig(planKey);
            if (!plan)
                throw new Error("Invalid Plan");
            const payload = {
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
            }
            else {
                // Default to PIX/BOLETO link if no card?
                payload.billingType = 'UNDEFINED';
            }
            try {
                const { data } = yield getApi().post('/subscriptions', payload);
                return data;
            }
            catch (error) {
                console.error("Asaas Create Subscription Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error; // Let controller handle
            }
        });
    },
    // 3. Update Subscription (Upgrade/Downgrade)
    updateSubscription(subscriptionId, newPlanKey) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const plan = getPlanConfig(newPlanKey);
            if (!plan)
                throw new Error("Invalid Plan");
            const payload = {
                value: plan.price,
                cycle: plan.cycle,
                updatePendingPayments: true // Update future charges
            };
            try {
                const { data } = yield getApi().post(`/subscriptions/${subscriptionId}`, payload);
                return data;
            }
            catch (error) {
                console.error("Asaas Update Subscription Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    },
    getSubscription(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield getApi().get(`/subscriptions/${subscriptionId}`);
                return data;
            }
            catch (error) {
                return null;
            }
        });
    },
    getSubscriptionPayments(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield getApi().get(`/subscriptions/${subscriptionId}/payments`);
                return data.data; // Array of payments
            }
            catch (error) {
                console.error("Error fetching sub payments", error);
                return [];
            }
        });
    },
    createPayment(customerId, value, description) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Create one-off payment
                const payload = {
                    customer: customerId,
                    billingType: 'UNDEFINED', // Let user choose in Asaas Invoice
                    value: value,
                    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days expiry
                    description: description
                };
                const { data } = yield getApi().post('/payments', payload);
                return data;
            }
            catch (error) {
                console.error("Create Payment Error", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw error;
            }
        });
    }
};
