
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const key = process.env.GEMINI_API_KEY;

if (!key) { console.error("Sem chave"); process.exit(1); }

async function list() {
    console.log("Listando modelos para a chave informada...");
    // A SDK do Google não expõe listModels diretamente na classe principal facilmente em versões antigas,
    // mas vamos tentar fazer um fetch direto na API REST para ter certeza absoluta.
    // URL: https://generativelanguage.googleapis.com/v1beta/models?key=API_KEY

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        // Usando fetch nativo do Node 18+ (ambiente do usuário parece ser recente, v18/v20)
        const res = await fetch(url);
        const data = await res.json();

        if (data.models) {
            console.log("=== MODELOS DISPONÍVEIS ===");
            data.models.forEach((m: any) => {
                console.log(`- ${m.name} (${m.supportedGenerationMethods?.join(', ')})`);
            });
        } else {
            console.error("Erro ao listar modelos:", JSON.stringify(data, null, 2));
        }

    } catch (e: any) {
        console.error("Erro no fetch:", e.message);
    }
}

list();
