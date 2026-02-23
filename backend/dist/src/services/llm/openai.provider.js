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
exports.OpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIProvider {
    constructor(apiKey) {
        this.modelName = 'gpt-4o'; // Updated to latest efficient model
        this.client = new openai_1.default({ apiKey });
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = [];
            if (systemPrompt)
                messages.push({ role: 'system', content: systemPrompt });
            messages.push({ role: 'user', content: prompt });
            try {
                const completion = yield this.client.chat.completions.create({
                    messages,
                    model: this.modelName,
                });
                return completion.choices[0].message.content || "";
            }
            catch (e) {
                console.warn(`[OpenAI] ${this.modelName} failed (${e.message}). Switch to gpt-3.5-turbo.`);
                // Fallback for Tier 1 accounts
                const completion = yield this.client.chat.completions.create({
                    messages,
                    model: "gpt-3.5-turbo",
                });
                return completion.choices[0].message.content || "";
            }
        });
    }
    generateJSON(prompt, _schema) {
        return __awaiter(this, void 0, void 0, function* () {
            let text = "{}";
            try {
                const completion = yield this.client.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: this.modelName
                });
                text = completion.choices[0].message.content || "{}";
            }
            catch (e) {
                console.warn(`[OpenAI] ${this.modelName} JSON failed (${e.message}). Switch to gpt-3.5-turbo.`);
                const completion = yield this.client.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: "gpt-3.5-turbo"
                });
                text = completion.choices[0].message.content || "{}";
            }
            // SANITIZATION
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                // Find first [ or {
                const firstOpen = text.search(/[\{\[]/);
                // const lastClose = text.search(/[\}\]]$/); // Simple check
                if (firstOpen !== -1) {
                    // Try to parse from first brace/bracket to the end
                    // We rely on JSON.parse to ignore trailing whitespace, but it might fail on trailing chars.
                    // Best effort:
                    const start = text.indexOf('[');
                    const end = text.lastIndexOf(']');
                    if (start !== -1 && end !== -1 && end > start) {
                        return JSON.parse(text.substring(start, end + 1));
                    }
                    const startObj = text.indexOf('{');
                    const endObj = text.lastIndexOf('}');
                    if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
                        return JSON.parse(text.substring(startObj, endObj + 1));
                    }
                }
                return JSON.parse(text);
            }
            catch (e) {
                console.error("OpenAI JSON Parse Error", e);
                throw new Error(`OpenAI JSON Parse Failed: ${text.substring(0, 100)}...`);
            }
        });
    }
}
exports.OpenAIProvider = OpenAIProvider;
