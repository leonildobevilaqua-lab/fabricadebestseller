import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./provider.interface";

// NOTE: process.env should be loaded by the entry point (index.ts/server.ts)
// We will rely on that instead of trying to guess paths here.

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    // UPDATED: Prioritizing Gemini 2.5 Flash as requested and verified in AI Studio.
    // This model provides the best balance of speed, cost and quality for this project.
    private models = [
        "gemini-2.5-flash",  // PRIMARY: User confirmed active
        "gemini-2.5-pro",    // SECONDARY: User confirmed active
        "gemini-2.0-flash",  // GA STABLE: High performance
        "gemini-1.5-flash",  // LEGACY STABLE
    ];


    constructor(apiKey: string) {
        let key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
        if (!key) throw new Error("GEMINI_API_KEY Not Found.");
        this.client = new GoogleGenerativeAI(key);
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
        let lastError: any;

        for (const modelName of this.models) {
            try {
                const generativeModel = this.client.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any }
                    ]
                });

                const resultFn = generativeModel.generateContent(finalPrompt);
                const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error(`Timeout after 300s on ${modelName}`)), 300000));
                const result = await Promise.race([resultFn, timeoutPromise]);

                const response = await result.response;
                const text = response.text();
                if (!text) throw new Error(`Empty response from ${modelName}`);
                
                console.log(`[GEMINI] Success using ${modelName} (${text.length} chars)`);
                return text;
            } catch (error: any) {
                console.error(`[GEMINI] Model ${modelName} CRITICAL FAILURE:`, error.message);
                lastError = error;
                // Wait 1s before next model to avoid hitting rate limits too fast
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw lastError;
    }

    async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
        let lastError: any;
        for (const modelName of this.models) {
            try {
                const generativeModel = this.client.getGenerativeModel({
                    model: modelName,
                    generationConfig: { responseMimeType: "application/json", temperature: 0.7, maxOutputTokens: 8000 },
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HARASSMENT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_HATE_SPEECH' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, threshold: 'BLOCK_NONE' as any },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, threshold: 'BLOCK_NONE' as any }
                    ]
                });

                const resultFn = generativeModel.generateContent(prompt);
                const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error(`Timeout JSON after 300s on ${modelName}`)), 300000));
                const result = await Promise.race([resultFn, timeoutPromise]) as any;
                const response = await result.response;
                let text = response.text();
                console.log(`[GEMINI_JSON] Success using ${modelName}`);

                // Robust JSON extraction for experimental models (like 2.5/3.0)
                // They might add conversational chatter even with responseMimeType
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();

                const firstBracket = text.indexOf('[');
                const lastBracket = text.lastIndexOf(']');
                const firstBrace = text.indexOf('{');
                const lastBrace = text.lastIndexOf('}');

                let cleaned = text;
                if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
                    cleaned = text.substring(firstBracket, lastBracket + 1);
                } else if (firstBrace !== -1) {
                    cleaned = text.substring(firstBrace, lastBrace + 1);
                }

                try {
                    return JSON.parse(cleaned);
                } catch (jsonErr) {
                    console.error(`[GEMINI] JSON Parse failed for model ${modelName}. Raw text:`, text.substring(0, 200));
                    throw jsonErr;
                }
            } catch (error: any) {
                console.warn(`[GEMINI] Model ${modelName} JSON failed:`, error.message);
                lastError = error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        throw lastError;
    }
}
