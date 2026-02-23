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
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.error("Sem chave");
    process.exit(1);
}
function list() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Listando modelos para a chave informada...");
        // A SDK do Google não expõe listModels diretamente na classe principal facilmente em versões antigas,
        // mas vamos tentar fazer um fetch direto na API REST para ter certeza absoluta.
        // URL: https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            // Usando fetch nativo do Node 18+ (ambiente do usuário parece ser recente, v18/v20)
            const res = yield fetch(url);
            const data = yield res.json();
            if (data.models) {
                console.log("=== MODELOS DISPONÍVEIS ===");
                data.models.forEach((m) => {
                    var _a;
                    console.log(`- ${m.name} (${(_a = m.supportedGenerationMethods) === null || _a === void 0 ? void 0 : _a.join(', ')})`);
                });
            }
            else {
                console.error("Erro ao listar modelos:", JSON.stringify(data, null, 2));
            }
        }
        catch (e) {
            console.error("Erro no fetch:", e.message);
        }
    });
}
list();
