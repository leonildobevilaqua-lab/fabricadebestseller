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

        // SANITIZATION
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            // Find first [ or {
            const firstOpen = text.search(/[\{\[]/);
            // const lastClose = text.search(/[\}\]]$/); // Simple check

            if (firstOpen !== -1) {
                // Try to parse from first brace/bracket to the end
                // We rely on JSON.parse to ignore trailing whitespace, but it might fail on trailing chars.
                // Best effort:
                const start = text.indexOf('[');
                const end = text.lastIndexOf(']');
                if (start !== -1 && end !== -1 && end > start) {
                    return JSON.parse(text.substring(start, end + 1));
                }
                const startObj = text.indexOf('{');
                const endObj = text.lastIndexOf('}');
                if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
                    return JSON.parse(text.substring(startObj, endObj + 1));
                }
            }
            return JSON.parse(text);
        } catch (e) {
            console.error("OpenAI JSON Parse Error", e);
            throw new Error(`OpenAI JSON Parse Failed: ${text.substring(0, 100)}...`);
        }
    }
}
