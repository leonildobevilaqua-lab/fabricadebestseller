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
const generative_ai_1 = require("@google/generative-ai");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
console.log("--- DIAGNOSTICO DE CONEXAO GEMINI ---");
console.log(`Lendo .env de: ${envPath}`);
const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.error("ERRO CRITICO: GEMINI_API_KEY não encontrada no arquivo .env");
    process.exit(1);
}
// Mascarar chave para o log
const maskedKey = key.substring(0, 5) + "..." + key.substring(key.length - 4);
console.log(`Chave encontrada: ${maskedKey}`);
const modelsToTest = ["gemini-1.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-pro"];
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new generative_ai_1.GoogleGenerativeAI(key);
        for (const modelName of modelsToTest) {
            console.log(`\nTestando modelo: ${modelName}...`);
            try {
                const model = client.getGenerativeModel({ model: modelName });
                const result = yield model.generateContent("Say 'Hello World' if you can hear me.");
                const response = yield result.response;
                const text = response.text();
                console.log(`✅ SUCESSO (${modelName}): Resposta da IA: "${text.trim()}"`);
                // Se um funcionar, já é um bom sinal, mas vamos testar todos para garantir.
            }
            catch (error) {
                console.error(`❌ FALHA (${modelName}):`);
                console.error(`   Status: ${error.status || 'N/A'}`);
                console.error(`   Mensagem: ${error.message}`);
                if (error.message.includes("API key")) {
                    console.error("   >>> DIAGNÓSTICO: A chave da API parece ser inválida ou expirou.");
                }
                else if (error.message.includes("not found")) {
                    console.error("   >>> DIAGNÓSTICO: O modelo solicitado não existe ou sua chave não tem acesso a ele.");
                }
                else if (error.message.includes("Quota")) {
                    console.error("   >>> DIAGNÓSTICO: Cota de uso excedida.");
                }
            }
        }
    });
}
testConnection();
