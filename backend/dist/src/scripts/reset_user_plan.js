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
    var _a;
    console.log(`Resetting plan for ${email}...`);
    try {
        const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        let found = false;
        for (const l of leads) {
            if (((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === email.toLowerCase().trim()) {
                console.log("Updating lead:", l.id, l.status);
                if (l.status === 'SUBSCRIBER' || l.status === 'APPROVED' || l.status === 'IN_PROGRESS') {
                    // Resetting status but keeping 'IN_PROGRESS' if we want to test 'usageCount'.
                    // Actually user wants to test subscription flow.
                    // If status is IN_PROGRESS, usageCount is 1.
                    // I'll set status to 'PENDING'.
                    l.status = 'PENDING';
                    found = true;
                }
            }
        }
        if (found)
            yield (0, db_service_1.setVal)('/leads', leads);
        // User Plan
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, null);
        console.log("Reset Complete.");
    }
    catch (e) {
        console.error(e);
    }
    process.exit(0);
});
run();
