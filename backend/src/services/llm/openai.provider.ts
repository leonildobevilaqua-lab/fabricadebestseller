import OpenAI from "openai";
import { LLMProvider } from "./provider.interface";

export class OpenAIProvider implements LLMProvider {
    private client: OpenAI;
    private modelName = 'gpt-4o'; // Updated to latest efficient model

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: any[] = [];
        if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
        messages.push({ role: 'user', content: prompt });

        try {
            const completion = await this.client.chat.completions.create({
                messages,
                model: this.modelName,
            });
            return completion.choices[0].message.content || "";
        } catch (e: any) {
            console.warn(`[OpenAI] ${this.modelName} failed (${e.message}). Switch to gpt-3.5-turbo.`);
            // Fallback for Tier 1 accounts
            const completion = await this.client.chat.completions.create({
                messages,
                model: "gpt-3.5-turbo",
            });
            return completion.choices[0].message.content || "";
        }
    }

    async generateJSON<T>(prompt: string, _schema?: any): Promise<T> {
        let text = "{}";

        try {
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: this.modelName
            });
            text = completion.choices[0].message.content || "{}";
        } catch (e: any) {
            console.warn(`[OpenAI] ${this.modelName} JSON failed (${e.message}). Switch to gpt-3.5-turbo.`);
            const completion = await this.client.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: "gpt-3.5-turbo"
            });
            text = completion.choices[0].message.content || "{}";
        }

        try {
            // Robust cleaning
            let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

            const firstBracket = cleaned.indexOf('[');
            const lastBracket = cleaned.lastIndexOf(']');
            const firstBrace = cleaned.indexOf('{');
            const lastBrace = cleaned.lastIndexOf('}');

            if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                cleaned = cleaned.substring(firstBracket, lastBracket + 1);
            } else if (firstBrace !== -1) {
                cleaned = cleaned.substring(firstBrace, lastBrace + 1);
            }

            return JSON.parse(cleaned);
        } catch (e) {
            console.error("OpenAI JSON Parse Error", e);
            throw new Error(`OpenAI JSON Parse Failed: ${text.substring(0, 100)}...`);
        }
    }
}
