import { LLMProvider } from "./llm/provider.interface";
import { GeminiProvider } from "./llm/gemini.provider";
import { OpenAIProvider } from "./llm/openai.provider";
import { AnthropicProvider } from "./llm/anthropic.provider";
import { GenericOpenAIProvider } from "./llm/generic.provider";
import { getConfig } from "./config.service";

import { FallbackProvider } from "./llm/fallback.provider";

export const getLLMProvider = async (): Promise<LLMProvider> => {
    const config = await getConfig();
    const active = config.activeProvider;

    // Helper to get OpenAI if available
    const getOpenAI = () => {
        if (!config.providers.openai) return null;
        return new OpenAIProvider(config.providers.openai);
    };

    switch (active) {
        case 'openai':
            if (!config.providers.openai) throw new Error("OpenAI Key missing");
            return new OpenAIProvider(config.providers.openai);
        case 'anthropic':
            if (!config.providers.anthropic) throw new Error("Anthropic Key missing");
            return new AnthropicProvider(config.providers.anthropic);
        case 'deepseek':
            if (!config.providers.deepseek) throw new Error("DeepSeek Key missing");
            return new GenericOpenAIProvider(config.providers.deepseek, "https://api.deepseek.com/v1", "deepseek-chat");
        case 'llama':
            if (!config.providers.llama) throw new Error("Llama/Groq Key missing");
            return new GenericOpenAIProvider(config.providers.llama, "https://api.groq.com/openai/v1", "llama3-70b-8192");
        case 'gemini':
        default:
            if (!config.providers.gemini) throw new Error("Gemini Key missing");
            const gemini = new GeminiProvider(config.providers.gemini);

            // RESILIENCE: If we have an OpenAI key, use it as fallback!
            const backup = getOpenAI();
            if (backup) {
                console.log("[LLM Factory] Initialized with Gemini + OpenAI Fallback System.");
                return new FallbackProvider(gemini, backup, "Gemini", "OpenAI");
            }

            return gemini;
    }
};
