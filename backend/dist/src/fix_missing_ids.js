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
const uuid_1 = require("uuid");
const db = new node_json_db_1.JsonDB(new node_json_db_1.Config("database", true, false, '/'));
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield db.reload();
        // Load RAW to ensure we act on array
        const leads = yield db.getData('/leads');
        if (!Array.isArray(leads)) {
            console.log("Leads is not an array");
            return;
        }
        let fixedCount = 0;
        const fixedLeads = leads.map((lead) => {
            if (!lead.id) {
                console.log(`Fixing lead without ID: ${lead.email}`);
                fixedCount++;
                return Object.assign(Object.assign({}, lead), { id: (0, uuid_1.v4)() });
            }
            return lead;
        });
        if (fixedCount > 0) {
            yield db.push('/leads', fixedLeads);
            console.log(`Fixed ${fixedCount} leads with missing IDs.`);
        }
        else {
            console.log("No leads with missing IDs found.");
        }
    }
    catch (e) {
        console.error("Error", e);
    }
});
run();
