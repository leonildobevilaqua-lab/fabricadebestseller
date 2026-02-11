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
class GeminiProvider {
    constructor(apiKey) {
        this.models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
            let lastError;
            for (const modelName of this.models) {
                try {
                    // FORCE CONFIG AS REQUESTED
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
                    // Add Timeout of 120s
                    const resultFn = generativeModel.generateContent(finalPrompt);
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini Request Timeout")), 120000));
                    const result = yield Promise.race([resultFn, timeoutPromise]);
                    const response = yield result.response;
                    if (!response)
                        throw new Error("Empty Response from Gemini");
                    return response.text();
                }
                catch (error) {
                    console.warn(`Failed with model ${modelName}:`, error.message);
                    lastError = error;
                    // Stop only on Critical Auth errors
                    if (error.message.includes('API key') || error.message.includes('permission')) {
                        // Check env var status for debugging
                        const keyStatus = process.env.GEMINI_API_KEY ? 'Present (Check validity)' : 'Missing';
                        console.error(`CRITICAL AUTH ERROR: ${error.message}. Key Status: ${keyStatus}`);
                        throw error;
                    }
                    // Continue to next model for 404, 400, 500, etc.
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
                        // Only use native JSON mode for 1.5 models to avoid errors on older ones
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
                    // Sanitize
                    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(text);
                }
                catch (error) {
                    console.warn(`Failed JSON with model ${modelName}:`, error.message);
                    lastError = error;
                    if (error.message.includes('API key'))
                        throw error;
                }
            }
            throw lastError;
        });
    }
}
exports.GeminiProvider = GeminiProvider;
