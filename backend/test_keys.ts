import { getConfig } from './src/services/config.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        console.log("=== DIAGNOSTICO DE CONFIGURAÇÃO ===");
        const config = await getConfig();
        console.log("Provedor Ativo no Banco:", config.activeProvider);
        console.log("Chave Gemini configurada (tamanho):", config.providers.gemini?.length || 0);
        console.log("Chave OpenAI configurada (tamanho):", config.providers.openai?.length || 0);
        console.log("Provedores disponíveis:", Object.keys(config.providers).filter(k => !!config.providers[k as keyof typeof config.providers]));
    } catch (e) {
        console.error("Erro no diagnóstico:", e);
    }
}
run();
