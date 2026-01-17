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
const config_service_1 = require("./services/config.service");
const generative_ai_1 = require("@google/generative-ai");
const db_service_1 = require("./services/db.service");
function testGemini() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("Reloading DB...");
        yield (0, db_service_1.reloadDB)();
        console.log("Fetching Config...");
        const config = yield (0, config_service_1.getConfig)();
        const apiKey = config.providers.gemini;
        if (!apiKey) {
            console.error("ERROR: No Gemini Key Found in Config!");
            return;
        }
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.5-flash", "models/gemini-2.5-flash"];
        console.log(`Testing ${models.length} models with Key...`);
        for (const m of models) {
            try {
                console.log(`Testing ${m}...`);
                const model = genAI.getGenerativeModel({ model: m });
                const result = yield model.generateContent("Test");
                const response = yield result.response;
                console.log(`SUCCESS: ${m} - Response: ${response.text()}`);
            }
            catch (e) {
                console.log(`FAILED: ${m} - Status: ${e.status || 'Unknown'} - ${(_a = e.message) === null || _a === void 0 ? void 0 : _a.slice(0, 100)}...`);
            }
        }
    });
}
testGemini();
