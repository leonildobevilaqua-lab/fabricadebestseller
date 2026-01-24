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
const node_json_db_1 = require("node-json-db");
const db = new node_json_db_1.JsonDB(new node_json_db_1.Config("database", true, false, '/'));
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.reload();
        const leads = yield db.getData('/leads');
        if (!Array.isArray(leads)) {
            console.log("Leads is not an array");
            return;
        }
        console.log(`Total leads before cleanup: ${leads.length}`);
        // FILTER: Keep leads that are NOT (Name == 'Manual Grant' AND Date is missing/invalid)
        const validLeads = leads.filter((lead) => {
            const isManualGrant = lead.name === 'Manual Grant';
            const hasInvalidDate = !lead.date || lead.date === 'Invalid Date';
            if (isManualGrant && hasInvalidDate) {
                console.log(`Deleting corrupt lead: ${lead.email} - ${lead.name}`);
                return false; // Remove
            }
            return true; // Keep
        });
        console.log(`Total leads after cleanup: ${validLeads.length}`);
        // Save back
        yield db.push('/leads', validLeads);
        console.log("Database updated successfully.");
    }
    catch (e) {
        console.error("Error", e);
    }
});
run();
