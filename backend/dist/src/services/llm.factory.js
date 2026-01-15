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
exports.getLLMProvider = void 0;
const gemini_provider_1 = require("./llm/gemini.provider");
const openai_provider_1 = require("./llm/openai.provider");
const anthropic_provider_1 = require("./llm/anthropic.provider");
const generic_provider_1 = require("./llm/generic.provider");
const config_service_1 = require("./config.service");
const getLLMProvider = () => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getConfig)();
    const active = config.activeProvider;
    switch (active) {
        case 'openai':
            if (!config.providers.openai)
                throw new Error("OpenAI Key missing");
            return new openai_provider_1.OpenAIProvider(config.providers.openai);
        case 'anthropic':
            if (!config.providers.anthropic)
                throw new Error("Anthropic Key missing");
            return new anthropic_provider_1.AnthropicProvider(config.providers.anthropic);
        case 'deepseek':
            if (!config.providers.deepseek)
                throw new Error("DeepSeek Key missing");
            return new generic_provider_1.GenericOpenAIProvider(config.providers.deepseek, "https://api.deepseek.com/v1", "deepseek-chat");
        case 'llama':
            if (!config.providers.llama)
                throw new Error("Llama/Groq Key missing");
            return new generic_provider_1.GenericOpenAIProvider(config.providers.llama, "https://api.groq.com/openai/v1", "llama3-70b-8192");
        case 'gemini':
        default:
            if (!config.providers.gemini)
                throw new Error("Gemini Key missing");
            return new gemini_provider_1.GeminiProvider(config.providers.gemini);
    }
});
exports.getLLMProvider = getLLMProvider;
