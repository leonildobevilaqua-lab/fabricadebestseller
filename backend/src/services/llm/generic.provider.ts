import OpenAI from "openai";
import { LLMProvider } from "./provider.interface";

// Generic provider for OpenAI-compatible APIs (DeepSeek, Groq/Llama, etc)
export class GenericOpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private modelName: string;

    constructor(apiKey: string, baseURL: string, modelName: string) {
        this.client = new OpenAI({ apiKey, baseURL });
        this.modelName = modelName;
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        const completion = await this.client.chat.completions.create({
            messages,
            model: this.modelName,
        });

        return completion.choices[0].message.content || "";
    }

    async generateJSON<T>(prompt: string, _schema?: any): Promise<T> {
        // Some open models support json_object, some don't. We force it in prompt.
        const completion = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt + "\nRespond with valid JSON only." }],
            model: this.modelName,
            // Safe to assume json_object on DeepSeek? Yes usually. Groq? Yes.
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content || "{}");
    }
}
