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

    // 1. Prepare Providers
    const gemini = config.providers.gemini ? new GeminiProvider(config.providers.gemini) : null;
    const openai = config.providers.openai ? new OpenAIProvider(config.providers.openai) : null;

    // 2. Logic: IF Gemini exists, it is ALWAYS the primary (Absolute Priority)
    if (gemini) {
        if (openai) {
            console.log("[LLMFactory] Using Gemini as Primary with OpenAI Fallback.");
            return new FallbackProvider(gemini, openai, "Gemini", "OpenAI");
        }
        console.log("[LLMFactory] Using Gemini ONLY (No OpenAI Key).");
        return gemini;
    }

    // 3. Fallback to other providers if Gemini is missing
    console.warn(`[LLMFactory] Gemini key missing. Using requested provider: ${active}`);

    switch (active) {
        case 'openai':
            if (openai) return openai;
            break;
        case 'anthropic':
            if (config.providers.anthropic) return new AnthropicProvider(config.providers.anthropic);
            break;
        case 'deepseek':
            if (config.providers.deepseek) return new GenericOpenAIProvider(config.providers.deepseek, "https://api.deepseek.com/v1", "deepseek-chat");
            break;
        case 'llama':
            if (config.providers.llama) return new GenericOpenAIProvider(config.providers.llama, "https://api.groq.com/openai/v1", "llama3-70b-8192");
            break;
    }

    // LAST RESORT
    if (openai) {
        console.warn("[LLMFactory] Falling back to OpenAI as last resort.");
        return openai;
    }

    throw new Error("Nenhum provedor de IA configurado corretamente (Gemini key missing and fallback failed)");
};
