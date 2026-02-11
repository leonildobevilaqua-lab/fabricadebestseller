
import { LLMProvider } from "./provider.interface";
import { logError } from "../../utils/logger";

export class FallbackProvider implements LLMProvider {
    constructor(
        private primary: LLMProvider,
        private secondary: LLMProvider,
        private primaryName: string = "Primary",
        private secondaryName: string = "Backup"
    ) { }

    async generateText(prompt: string, systemPrompt?: string): Promise<string> {
        try {
            return await this.primary.generateText(prompt, systemPrompt);
        } catch (error: any) {
            console.warn(`[LLM] ${this.primaryName} failed. Switching to ${this.secondaryName}. Error: ${error.message}`);
            logError(`LLM_FALLBACK_TEXT_${this.primaryName}_TO_${this.secondaryName}`, error);

            try {
                const result = await this.secondary.generateText(prompt, systemPrompt);
                console.log(`[LLM] ${this.secondaryName} RESCUED the generation!`);
                return result;
            } catch (secError: any) {
                console.error(`[LLM] Both providers failed!`);
                logError(`LLM_FAIL_BOTH`, secError);
                throw secError; // If both fail, we really fail.
            }
        }
    }

    async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
        try {
            return await this.primary.generateJSON<T>(prompt, schema);
        } catch (error: any) {
            console.warn(`[LLM] ${this.primaryName} JSON gen failed. Switching to ${this.secondaryName}. Error: ${error.message}`);
            logError(`LLM_FALLBACK_JSON_${this.primaryName}_TO_${this.secondaryName}`, error);

            try {
                const result = await this.secondary.generateJSON<T>(prompt, schema);
                console.log(`[LLM] ${this.secondaryName} RESCUED the JSON generation!`);
                return result;
            } catch (secError: any) {
                console.error(`[LLM] Both providers failed JSON!`);
                logError(`LLM_FAIL_BOTH_JSON`, secError);
                throw secError;
            }
        }
    }
}
