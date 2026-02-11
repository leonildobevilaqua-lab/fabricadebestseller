"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
function testOpenAI() {
    return __awaiter(this, void 0, void 0, function* () {
        const key = process.env.OPENAI_API_KEY;
        console.log("Testing OpenAI Key:", key ? key.substring(0, 8) + "..." : "MISSING");
        if (!key)
            return;
        const client = new openai_1.default({ apiKey: key });
        try {
            console.log("Sending request to gpt-4o...");
            const chatCompletion = yield client.chat.completions.create({
                messages: [{ role: 'user', content: 'Say hello' }],
                model: 'gpt-4o',
            });
            console.log("Success gpt-4o:", chatCompletion.choices[0].message.content);
        }
        catch (e) {
            console.error("Failed gpt-4o:", e.message);
            try {
                console.log("Sending request to gpt-3.5-turbo...");
                const chatCompletion = yield client.chat.completions.create({
                    messages: [{ role: 'user', content: 'Say hello' }],
                    model: 'gpt-3.5-turbo',
                });
                console.log("Success gpt-3.5-turbo:", chatCompletion.choices[0].message.content);
            }
            catch (e2) {
                console.error("Failed gpt-3.5-turbo:", e2.message);
            }
        }
    });
}
testOpenAI();
