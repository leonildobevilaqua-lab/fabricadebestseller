import { getLLMProvider } from './src/services/llm.factory';
import * as dotenv from 'dotenv';
dotenv.config();

const samplePrompt = `
Você é um assistente especialista em publicação de livros.
Vou te fornecer as primeiras páginas de um manuscrito (texto cru).
Sua tarefa é extrair os seguintes metadados principais do livro:
1. title (Título Principal)
2. subtitle (Subtítulo, se houver)
3. author (Nome do Autor)
4. niche (Nicho principal, ex: Negócios & Marketing, Romance, etc)
5. subniche (Sub-nicho, ex: Vendas, Escrita Criativa, etc)

Retorne APENAS um objeto JSON no seguinte formato, sem nenhum outro texto ao redor:
{
    "title": "...",
    "subtitle": "...",
    "author": "...",
    "niche": "...",
    "subniche": "..."
}

TEXTO DO MANUSCRITO:
Os Pilares do Eu. Paternagem e Maternagem na Arquitetura da Identidade Infantil.
Jonas Silva.
`;

async function run() {
    try {
        console.log("=== INICIANDO TESTE DE GERAÇÃO LLM ===");
        const llm = await getLLMProvider();
        console.log("Instanciou provedor. Chamando generateJSON...");
        const result = await llm.generateJSON(samplePrompt);
        console.log("GERAÇÃO CONCLUÍDA COM SUCESSO! Resultado:");
        console.log(JSON.stringify(result, null, 4));
    } catch (e: any) {
        console.error("\n!!! ERRO CRÍTICO NA GERAÇÃO !!!");
        console.error("Mensagem:", e.message);
        console.error("Stack Trace Completo:", e.stack);
    }
}
run();
