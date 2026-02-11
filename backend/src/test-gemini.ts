
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env');
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

async function testConnection() {
    const client = new GoogleGenerativeAI(key as string);

    for (const modelName of modelsToTest) {
        console.log(`\nTestando modelo: ${modelName}...`);
        try {
            const model = client.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'Hello World' if you can hear me.");
            const response = await result.response;
            const text = response.text();
            console.log(`✅ SUCESSO (${modelName}): Resposta da IA: "${text.trim()}"`);
            // Se um funcionar, já é um bom sinal, mas vamos testar todos para garantir.
        } catch (error: any) {
            console.error(`❌ FALHA (${modelName}):`);
            console.error(`   Status: ${error.status || 'N/A'}`);
            console.error(`   Mensagem: ${error.message}`);

            if (error.message.includes("API key")) {
                console.error("   >>> DIAGNÓSTICO: A chave da API parece ser inválida ou expirou.");
            } else if (error.message.includes("not found")) {
                console.error("   >>> DIAGNÓSTICO: O modelo solicitado não existe ou sua chave não tem acesso a ele.");
            } else if (error.message.includes("Quota")) {
                console.error("   >>> DIAGNÓSTICO: Cota de uso excedida.");
            }
        }
    }
}

testConnection();
