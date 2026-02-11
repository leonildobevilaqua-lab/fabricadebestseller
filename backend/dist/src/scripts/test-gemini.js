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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const gemini_provider_1 = require("../services/llm/gemini.provider");
// Load env from backend root
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
function testGemini() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- Starting Gemini 2.5 Connectivity Test ---");
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("ERROR: GEMINI_API_KEY not found in .env");
            process.exit(1);
        }
        console.log("API Key loaded (length):", apiKey.length);
        try {
            const provider = new gemini_provider_1.GeminiProvider(apiKey);
            console.log("Provider instantiated. Testing 'generateText'...");
            const start = Date.now();
            const response = yield provider.generateText("Hello! Are you Gemini 2.5? Please confirm your model version if possible or just say hello.");
            const duration = Date.now() - start;
            console.log("\n--- SUCCESS ---");
            console.log("Response Received in", duration, "ms");
            console.log("Response Content:\n", response);
            console.log("-----------------");
        }
        catch (error) {
            console.error("\n--- FAILURE ---");
            console.error("Error Message:", error.message);
            if (error.response) {
                console.error("API Response:", JSON.stringify(error.response, null, 2));
            }
            console.error("Full Trace:", error);
        }
    });
}
testGemini();
