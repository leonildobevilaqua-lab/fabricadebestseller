"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackProvider = void 0;
const logger_1 = require("../../utils/logger");
class FallbackProvider {
    constructor(primary, secondary, primaryName = "Primary", secondaryName = "Backup") {
        this.primary = primary;
        this.secondary = secondary;
        this.primaryName = primaryName;
        this.secondaryName = secondaryName;
    }
    generateText(prompt, systemPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.primary.generateText(prompt, systemPrompt);
            }
            catch (error) {
                console.warn(`[LLM] ${this.primaryName} failed. Switching to ${this.secondaryName}. Error: ${error.message}`);
                (0, logger_1.logError)(`LLM_FALLBACK_TEXT_${this.primaryName}_TO_${this.secondaryName}`, error);
                try {
                    const result = yield this.secondary.generateText(prompt, systemPrompt);
                    console.log(`[LLM] ${this.secondaryName} RESCUED the generation!`);
                    return result;
                }
                catch (secError) {
                    console.error(`[LLM] Both providers failed!`);
                    (0, logger_1.logError)(`LLM_FAIL_BOTH`, secError);
                    throw secError; // If both fail, we really fail.
                }
            }
        });
    }
    generateJSON(prompt, schema) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.primary.generateJSON(prompt, schema);
            }
            catch (error) {
                console.warn(`[LLM] ${this.primaryName} JSON gen failed. Switching to ${this.secondaryName}. Error: ${error.message}`);
                (0, logger_1.logError)(`LLM_FALLBACK_JSON_${this.primaryName}_TO_${this.secondaryName}`, error);
                try {
                    const result = yield this.secondary.generateJSON(prompt, schema);
                    console.log(`[LLM] ${this.secondaryName} RESCUED the JSON generation!`);
                    return result;
                }
                catch (secError) {
                    console.error(`[LLM] Both providers failed JSON!`);
                    (0, logger_1.logError)(`LLM_FAIL_BOTH_JSON`, secError);
                    throw secError;
                }
            }
        });
    }
}
exports.FallbackProvider = FallbackProvider;
