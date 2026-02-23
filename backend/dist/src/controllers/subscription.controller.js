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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const uuid_1 = require("uuid");
const asaas_provider_1 = require("../services/asaas.provider");
const subscriptions_config_1 = require("../config/subscriptions.config");
const db_service_1 = require("../services/db.service");
const findLeadIndex = (leads, email) => {
    return leads.findIndex((l) => { var _a; return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim(); });
};
exports.SubscriptionController = {
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const { email, name, cpfCnpj, phone, planKey, creditCard, address } = req.body;
            try {
                yield (0, db_service_1.reloadDB)();
                const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                let leadIndex = findLeadIndex(leads, email);
                let lead;
                if (leadIndex !== -1) {
                    lead = leads[leadIndex];
                }
                else {
                    console.log(`[SUBSCRIBE] User ${email} not found. Creating new lead.`);
                    lead = {
                        id: (0, uuid_1.v4)(),
                        email,
                        name: name || 'Novo Usuário',
                        phone: phone || '',
                        status: 'PENDING',
                        created_at: new Date()
                    };
                }
                // 1. Create Customer (with Address)
                const customerId = yield asaas_provider_1.AsaasProvider.createCustomer({
                    name: name || lead.name,
                    email,
                    cpfCnpj,
                    phone,
                    postalCode: address === null || address === void 0 ? void 0 : address.cep,
                    address: address === null || address === void 0 ? void 0 : address.street,
                    addressNumber: address === null || address === void 0 ? void 0 : address.number,
                    complement: address === null || address === void 0 ? void 0 : address.complement,
                    province: address === null || address === void 0 ? void 0 : address.neighborhood,
                    // city/state handled by CEP usually, but Asaas doesn't ask for them explicitly in simple payload?
                    // Actually Asaas works best with just CEP + Number.
                });
                // 2. Create Subscription
                const subscription = yield asaas_provider_1.AsaasProvider.createSubscription(customerId, planKey, creditCard);
                // 3. Save to DB
                const planConfig = subscriptions_config_1.PLANS[planKey];
                const updatedLead = Object.assign(Object.assign({}, lead), { asaas_customer_id: customerId, asaas_subscription_id: subscription.id, plan: {
                        name: planKey,
                        status: 'PENDING',
                        startDate: new Date(),
                        subscriptionId: subscription.id,
                        features: planConfig.features,
                        billing: 'monthly'
                    }, status: 'SUBSCRIBER_PENDING' });
                if (leadIndex !== -1) {
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]`, updatedLead);
                }
                else {
                    yield (0, db_service_1.pushVal)('/leads', updatedLead);
                }
                const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, updatedLead.plan);
                // Fetch Payment Link
                const payments = yield asaas_provider_1.AsaasProvider.getSubscriptionPayments(subscription.id);
                const invoiceUrl = ((_a = payments === null || payments === void 0 ? void 0 : payments[0]) === null || _a === void 0 ? void 0 : _a.invoiceUrl) || ((_b = payments === null || payments === void 0 ? void 0 : payments[0]) === null || _b === void 0 ? void 0 : _b.bankSlipUrl);
                res.json({ success: true, subscription, invoiceUrl });
            }
            catch (error) {
                console.error("Subscribe Error", error);
                res.status(500).json({ error: ((_f = (_e = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.errors) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.description) || error.message });
            }
        });
    },
    changePlan(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { email, newPlanKey } = req.body;
            try {
                yield (0, db_service_1.reloadDB)();
                const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                let leadIndex = findLeadIndex(leads, email);
                if (leadIndex === -1)
                    return res.status(404).json({ error: "User not found" });
                const lead = leads[leadIndex];
                const subId = lead.asaas_subscription_id;
                if (!subId)
                    return res.status(400).json({ error: "No active subscription found" });
                // Call Asaas
                const result = yield asaas_provider_1.AsaasProvider.updateSubscription(subId, newPlanKey);
                // Update Local
                const planConfig = subscriptions_config_1.PLANS[newPlanKey];
                const updatedPlan = Object.assign(Object.assign({}, lead.plan), { name: newPlanKey, features: planConfig.features, billing: 'monthly' });
                yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/plan`, updatedPlan);
                const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, updatedPlan);
                res.json({ success: true, result });
            }
            catch (error) {
                res.status(500).json({ error: ((_d = (_c = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.description) || error.message });
            }
        });
    },
    webhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const token = req.headers['asaas-access-token'] || req.body.authToken; // Asaas sends in header or body depending on version
            const EXPECTED = process.env.ASAAS_WEBHOOK_TOKEN || 'FabricaAsaas2026';
            if (token !== EXPECTED) {
                console.warn(`[WEBHOOK] Invalid Token: ${token} vs ${EXPECTED}`);
                return res.status(401).json({ error: "Unauthorized" });
            }
            const event = req.body;
            console.log("Asaas Webhook Event:", event.event);
            // Handle Status Updates
            if (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED') {
                const payment = event.payment;
                const subId = payment.subscription;
                // const email = payment.billingType === 'PIX' ? payment.customer : null; // Unused for now
                if (subId) {
                    console.log(`[WEBHOOK] Subscription Payment ${subId} Confirmed!`);
                    yield (0, db_service_1.reloadDB)();
                    const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                    const leadIndex = leads.findIndex((l) => l.asaas_subscription_id === subId);
                    if (leadIndex !== -1) {
                        const lead = leads[leadIndex];
                        console.log(`[WEBHOOK] Activating Plan for ${lead.email}`);
                        const updatedLead = Object.assign(Object.assign({}, lead), { plan: Object.assign(Object.assign({}, lead.plan), { status: 'ACTIVE', lastPayment: new Date() }), status: 'SUBSCRIBER' });
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]`, updatedLead);
                        const safeEmail = lead.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                        yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, updatedLead.plan);
                    }
                }
                else {
                    // One-off Payment?
                    console.log(`[WEBHOOK] One-off Payment ${payment.id} Confirmed!`);
                    // Use payment.customer to find user if needed
                }
            }
            res.json({ received: true });
        });
    }
};
