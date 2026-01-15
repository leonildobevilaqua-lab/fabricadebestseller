export interface LLMProvider {
    generateText(prompt: string, systemPrompt?: string): Promise<string>;
    generateJSON<T>(prompt: string, schema?: any): Promise<T>;
}
