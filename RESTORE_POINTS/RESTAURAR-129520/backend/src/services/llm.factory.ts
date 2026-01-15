import { LLMProvider } from "./llm/provider.interface";
import { GeminiProvider } from "./llm/gemini.provider";
import { OpenAIProvider } from "./llm/openai.provider";
import { AnthropicProvider } from "./llm/anthropic.provider";
import { GenericOpenAIProvider } from "./llm/generic.provider";
import { getConfig } from "./config.service";

export const getLLMProvider = (): LLMProvider => {
    const config = getConfig();
    const active = config.activeProvider;

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
            return new GeminiProvider(config.providers.gemini);
    }
};
