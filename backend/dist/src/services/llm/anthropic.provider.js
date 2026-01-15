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
exports.AnthropicProvider = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
class AnthropicProvider {
    constructor(apiKey) {
        this.modelName = 'claude-3-opus-20240229';
        this.client = new sdk_1.default({ apiKey });
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = yield this.client.messages.create({
                model: this.modelName,
                max_tokens: 4000,
                system: systemPrompt,
                messages: [{ role: "user", content: prompt }],
            });
            const content = msg.content[0];
            if (content.type === 'text')
                return content.text;
            return "";
        });
    }
    generateJSON(prompt, _schema) {
        return __awaiter(this, void 0, void 0, function* () {
            const msg = yield this.client.messages.create({
                model: this.modelName,
                max_tokens: 4000,
                messages: [{ role: "user", content: prompt + "\n\nReturn ONLY JSON." }],
            });
            const content = msg.content[0];
            let text = "";
            if (content.type === 'text')
                text = content.text;
            // Extract JSON block if needed
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch)
                text = jsonMatch[0];
            return JSON.parse(text);
        });
    }
}
exports.AnthropicProvider = AnthropicProvider;
