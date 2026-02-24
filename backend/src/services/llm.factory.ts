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

    // STRICT PRIORITY: Always default to Gemini if key exists, ignoring 'activeProvider' if it's not explicitly requested for something else
    // But better to respect the switch but ensure Gemini is the master.

    switch (active) {
        case 'openai':
            if (config.providers.openai) return new OpenAIProvider(config.providers.openai);
            // Fallback to gemini if openai selected but key missing
            if (config.providers.gemini) return new GeminiProvider(config.providers.gemini);
            throw new Error("OpenAI selected but key missing, and Gemini fallback also missing.");
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

    // DEFAULT ACTION: Use Gemini
    if (config.providers.gemini) return new GeminiProvider(config.providers.gemini);

    // LAST RESORT: If everything above fails/skipped
    if (config.providers.openai) return new OpenAIProvider(config.providers.openai);

    throw new Error("Nenhum provedor de IA configurado corretamente (Gemini key missing?)");
};
