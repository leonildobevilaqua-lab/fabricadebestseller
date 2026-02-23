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
const db_service_1 = require("../services/db.service");
const email = 'contato@leonildobevilaqua.com.br';
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Checking usage for ${email}...`);
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        console.log(`Total Leads: ${leads.length}`);
        let count = 0;
        leads.forEach((l) => {
            var _a, _b;
            if (((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim()) {
                console.log(`Lead ${l.id}: Status=${l.status}, Plan=${(_b = l.plan) === null || _b === void 0 ? void 0 : _b.name}`);
                if (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE') {
                    count++;
                }
            }
        });
        const usageCount = count; // leads.filter(...)
        console.log(`Calculated Usage Count: ${usageCount}`);
        const cycleIndex = usageCount % 4;
        console.log(`Cycle Index: ${cycleIndex} (Level ${cycleIndex + 1})`);
        // Check Plan Status
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        const userPlan = yield (0, db_service_1.getVal)(`/users/${safeEmail}/plan`);
        console.log("User Plan:", userPlan);
    }
    catch (e) {
        console.error(e);
    }
    process.exit(0);
});
run();
