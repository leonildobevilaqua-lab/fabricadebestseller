import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider } from "./provider.interface";

export class AnthropicProvider implements LLMProvider {
    private client: Anthropic;
    private modelName = 'claude-3-opus-20240229';

    constructor(apiKey: string) {
        this.client = new Anthropic({ apiKey });
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const msg = await (this.client as any).messages.create({
            model: this.modelName,
            max_tokens: 4000,
            system: systemPrompt,
            messages: [{ role: "user", content: prompt }],
        });

        const content = msg.content[0];
        if (content.type === 'text') return content.text;
        return "";
    }

    async generateJSON<T>(prompt: string, _schema?: any): Promise<T> {
        const msg = await (this.client as any).messages.create({
            model: this.modelName,
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt + "\n\nReturn ONLY JSON." }],
        });

        const content = msg.content[0];
        let text = "";
        if (content.type === 'text') text = content.text;

        // Extract JSON block if needed
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) text = jsonMatch[0];

        return JSON.parse(text);
    }
}
