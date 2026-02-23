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
exports.GeminiProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
// NOTE: process.env should be loaded by the entry point (index.ts/server.ts)
// We will rely on that instead of trying to guess paths here.
class GeminiProvider {
    constructor(apiKey) {
        // UPDATED: Comprehensive list including user-requested 'gemini-2.5-flash'
        // Tries 2.5 (User Preferred) -> 1.5 Flash (Standard) -> 1.5 Pro (Quality) -> Legacy
        // UPDATED: Prioritizing STABLE models for Production
        // Removed 2.5 as it was causing instability/hallucinations
        this.models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.0-pro"
        ];
        // FAILSAFE: Try to load key from process or manual check
        let key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        if (!key) {
            console.warn("GeminiProvider: Key missing in process.env, attempting manual .env load...");
            try {
                // Emergency load for production oddities
                require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
                key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
                if (key)
                    console.log("GeminiProvider: Key recovered via manual load.");
            }
            catch (e) {
                console.error("GeminiProvider: Manual load failed", e);
            }
        }
        if (!key) {
            console.error("CRITICAL: GEMINI_API_KEY MISSING IN PROVIDER - AI WILL FAIL");
            throw new Error("GEMINI_API_KEY Not Found. Check Environment Variables.");
        }
        this.client = new generative_ai_1.GoogleGenerativeAI(key);
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
            let lastError;
            for (const modelName of this.models) {
                try {
                    const generativeModel = this.client.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 8000,
                        },
                        // DISABLE SAFETY FILTERS to prevent blocking valid book topics
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ]
                    });
                    // Add Timeout of 60s (Faster failover)
                    const resultFn = generativeModel.generateContent(finalPrompt);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini Request Timeout")), 60000));
                    const result = yield Promise.race([resultFn, timeoutPromise]);
                    const response = yield result.response;
                    if (!response)
                        throw new Error("Empty Response from Gemini");
                    console.log(`[GEMINI] SUCCESS: Connected and generated with model: ${modelName}`);
                    return response.text();
                }
                catch (error) {
                    console.warn(`Failed with model ${modelName}:`, error.message);
                    lastError = error;
                    // RESILIENCE FIX: Do NOT throw immediately on Key/Permission errors.
                    // Just let it try the next model. If the key is truly invalid for ALL, 
                    // it will finish the loop and throw 'lastError' at the end.
                    // This handles cases where 'gemini-2.5-flash' returns 403 (Permission) but '1.5' works.
                    /*
                    if (error.message.includes('API key') || error.message.includes('permission')) {
                        throw error;
                    }
                    */
                }
            }
            throw lastError; // Throw the last error if all models fail
        });
    }
    generateJSON(prompt, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastError;
            for (const modelName of this.models) {
                try {
                    const generativeModel = this.client.getGenerativeModel({
                        model: modelName,
                        generationConfig: {
                            responseMimeType: "application/json",
                            temperature: 0.7,
                            maxOutputTokens: 8000
                        },
                        safetySettings: [
                            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                        ]
                    });
                    const result = yield generativeModel.generateContent(prompt);
                    let text = result.response.text();
                    // Advanced Sanitize
                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    // If text starts with [ but has garbage before it, clean it
                    const firstBracket = text.indexOf('[');
                    const lastBracket = text.lastIndexOf(']');
                    if (firstBracket !== -1 && lastBracket !== -1) {
                        text = text.substring(firstBracket, lastBracket + 1);
                    }
                    return JSON.parse(text);
                }
                catch (error) {
                    console.warn(`Failed JSON with model ${modelName}:`, error.message);
                    lastError = error;
                    // RESILIENCE FIX: Allow iterating to next model
                    // if (error.message.includes('API key')) throw error;
                }
            }
            throw lastError;
        });
    }
}
exports.GeminiProvider = GeminiProvider;
