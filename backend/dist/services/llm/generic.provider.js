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
exports.GenericOpenAIProvider = void 0;
const openai_1 = __importDefault(require("openai"));
// Generic provider for OpenAI-compatible APIs (DeepSeek, Groq/Llama, etc)
class GenericOpenAIProvider {
    constructor(apiKey, baseURL, modelName) {
        this.client = new openai_1.default({ apiKey, baseURL });
        this.modelName = modelName;
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = [];
            if (systemPrompt)
                messages.push({ role: 'system', content: systemPrompt });
            messages.push({ role: 'user', content: prompt });
            const completion = yield this.client.chat.completions.create({
                messages,
                model: this.modelName,
            });
            return completion.choices[0].message.content || "";
        });
    }
    generateJSON(prompt, _schema) {
        return __awaiter(this, void 0, void 0, function* () {
            // Some open models support json_object, some don't. We force it in prompt.
            const completion = yield this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt + "\nRespond with valid JSON only." }],
                model: this.modelName,
                // Safe to assume json_object on DeepSeek? Yes usually. Groq? Yes.
                response_format: { type: "json_object" }
            });
            return JSON.parse(completion.choices[0].message.content || "{}");
        });
    }
}
exports.GenericOpenAIProvider = GenericOpenAIProvider;
