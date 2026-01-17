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
        this.models = ["gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
            let lastError;
            for (const modelName of this.models) {
                try {
                    const generativeModel = this.client.getGenerativeModel({ model: modelName });
                    const result = yield generativeModel.generateContent(finalPrompt);
                    const response = yield result.response;
                    return response.text();
                }
                catch (error) {
                    console.warn(`Failed with model ${modelName}:`, error.message);
                    lastError = error;
                    // If it's a 404, continue to next model. If it's auth error, break.
                    if (!error.message.includes('404') && !error.message.includes('not found')) {
                        // throw error; // Don't throw immediately, try other models if possible, unless it's Auth
                        if (error.message.includes('API key') || error.message.includes('permission'))
                            throw error;
                    }
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
                        generationConfig: modelName.includes('1.5') ? { responseMimeType: "application/json" } : undefined
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
                    if (!error.message.includes('404') && !error.message.includes('not found')) {
                        throw error;
                    }
                }
            }
            throw lastError;
        });
    }
}
exports.GeminiProvider = GeminiProvider;
