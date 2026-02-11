import OpenAI from "openai";
import { LLMProvider } from "./provider.interface";

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private modelName = 'gpt-4-turbo-preview';

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
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
        const completion = await this.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: this.modelName,
            response_format: { type: "json_object" }
        });

        return JSON.parse(completion.choices[0].message.content || "{}");
    }
}
