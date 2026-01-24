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
exports.assertFeature = exports.checkFeature = void 0;
const db_service_1 = require("../services/db.service");
const checkFeature = (email, feature) => __awaiter(void 0, void 0, void 0, function* () {
    if (!email)
        return false;
    // Normalize email
    const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
    try {
        // Try getting from cache/db
        const userPlan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
        // VIP Bypass
        if (email.includes('subevilaqua') || email.includes('admin'))
            return true;
        if (!userPlan)
            return false; // No plan
        // Check Status (Pending might not have access yet?)
        // Assuming ACTIVE or SUBSCRIBER
        /*
        if (userPlan.status !== 'ACTIVE' && userPlan.status !== 'SUBSCRIBER') return false;
        */
        // Check Feature
        const features = userPlan.features || {};
        return !!features[feature];
    }
    catch (e) {
        console.error("Feature Guard Error", e);
        return false;
    }
});
exports.checkFeature = checkFeature;
const assertFeature = (email, feature) => __awaiter(void 0, void 0, void 0, function* () {
    const hasAccess = yield (0, exports.checkFeature)(email, feature);
    if (!hasAccess)
        throw new Error(`Funcionalidade bloqueada: Seu plano atual não permite '${feature}'. Faça um upgrade.`);
});
exports.assertFeature = assertFeature;
