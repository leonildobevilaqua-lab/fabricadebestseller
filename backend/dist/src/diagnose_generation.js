"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const llm_factory_1 = require("./services/llm.factory");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
function diagnose() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- DIAGNOSTIC START ---");
        try {
            const llm = yield (0, llm_factory_1.getLLMProvider)();
            console.log("LLM Provider obtained:", llm.constructor.name);
            // Test Text Generation (Research)
            console.log("\n1. Testing Text Gen (Research Mock)...");
            try {
                const text = yield llm.generateText("Explain quantum physics in 1 sentence.");
                console.log("✅ Text Gen Success:", text);
            }
            catch (e) {
                console.error("❌ Text Gen Failed:", e.message);
            }
            // Test JSON Generation (Titles)
            console.log("\n2. Testing JSON Gen (Titles Mock)...");
            const prompt = `
            Generate 3 book titles about "Time Travel".
            Return ONLY a JSON Array of objects: [{"title": "t", "subtitle": "s"}]
        `;
            try {
                const json = yield llm.generateJSON(prompt);
                console.log("✅ JSON Gen Success:", JSON.stringify(json, null, 2));
            }
            catch (e) {
                console.error("❌ JSON Gen Failed:", e.message);
                console.error("Full Error:", e);
            }
        }
        catch (err) {
            console.error("FATAL SETUP ERROR:", err);
        }
    });
}
diagnose();
