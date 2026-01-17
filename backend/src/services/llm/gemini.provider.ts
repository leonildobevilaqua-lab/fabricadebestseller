import { GoogleGenerativeAI } from "@google/generative-ai";
import { LLMProvider } from "./provider.interface"; // Adjusted path since file is in services/llm

export class GeminiProvider implements LLMProvider {
    private client: GoogleGenerativeAI;
    private models = ["gemini-2.0-flash-exp", "gemini-1.5-flash"];

    constructor(apiKey: string) {
        this.client = new GoogleGenerativeAI(apiKey);
    }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        const finalPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

        let lastError: any;
        for (const modelName of this.models) {
            try {
                const generativeModel = this.client.getGenerativeModel({ model: modelName });

                // Add Timeout of 60s
                const resultFn = generativeModel.generateContent(finalPrompt);
                const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Gemini Request Timeout")), 60000));

                const result = await Promise.race([resultFn, timeoutPromise]);

                const response = await result.response;
                return response.text();
            } catch (error: any) {
                console.warn(`Failed with model ${modelName}:`, error.message);
                lastError = error;
                // If it's a 404, continue to next model. If it's auth error, break.
                if (!error.message.includes('404') && !error.message.includes('not found')) {
                    // throw error; // Don't throw immediately, try other models if possible, unless it's Auth
                    if (error.message.includes('API key') || error.message.includes('permission')) throw error;
                }
            }
        }
        throw lastError; // Throw the last error if all models fail
    }

    async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
        let lastError: any;
        for (const modelName of this.models) {
            try {
                const generativeModel = this.client.getGenerativeModel({
                    model: modelName,
                    // Only use native JSON mode for 1.5 models to avoid errors on older ones
                    generationConfig: modelName.includes('1.5') ? { responseMimeType: "application/json" } : undefined
                });

                const result = await generativeModel.generateContent(prompt);
                let text = result.response.text();

                // Sanitize
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(text);
            } catch (error: any) {
                console.warn(`Failed JSON with model ${modelName}:`, error.message);
                lastError = error;
                if (!error.message.includes('404') && !error.message.includes('not found')) {
                    throw error;
                }
            }
        }
        throw lastError;
    }
}
