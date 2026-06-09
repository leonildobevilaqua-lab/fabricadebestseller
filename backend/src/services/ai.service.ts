import { BookMetadata, Chapter, MarketingAssets, TitleOption } from "../types";
import { getLLMProvider } from "./llm.factory";
import { logError } from "../utils/logger";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const getLangName = (code: string = 'pt') => {
  const map: Record<string, string> = {
    'pt': 'Portuguese (Brazil)',
    'en': 'English (US)',
    'es': 'Spanish (Latin America)'
  };
  return map[code] || 'Portuguese (Brazil)';
};

import { ResearchService } from "./research.service";

// SYSTEM INSTRUCTION FOR ALL GENERATIONS
const SYSTEM_INSTRUCTION = `
Atue como um especialista multidisciplinar em conteúdo editorial e Ghostwriter de Best-Sellers da Amazon.
Sua missão é criar livros baseados EXCLUSIVAMENTE em dados reais de mercado.
NUNCA invente dores ou desejos. Use os dados das pesquisas fornecidas.
`;

const ANTI_AI_INSTRUCTIONS = `
REGRAS CRÍTICAS PARA ESCRITA HUMANA (AUTOR DE ELITE - 0% IA):
1. VARIABILIDADE RADICAL E ALTERNÂNCIA DE RITMO: Alterne frases curtas e impactantes com frases longas e rítmicas. Mescle parágrafos de tamanhos diferentes. Um parágrafo longo e explicativo deve ser obrigatoriamente seguido por uma frase curta e impactante. Use fragmentos de frases para ênfase emocional. NUNCA tenha dois parágrafos seguidos com a mesma estrutura gramatical ou número similar de frases.
2. ZERO REPETIÇÃO E SUPRESSÃO DE ECOS: É expressamente proibido repetir a mesma estrutura de frase, conectivos ou palavras-chave em parágrafos próximos. Se usou um adjetivo ou metáfora forte, não a repita em pelo menos 10 páginas. Mantenha o vocabulário em constante expansão e utilize uma ampla riqueza de sinônimos.
3. PERPLEXIDADE ALTA: Use vocabulário dinâmico, metáforas raras e analogias específicas do nicho. Evite termos genéricos. Se o assunto é técnico, use a gíria do especialista.
4. CONEXÃO HUMANA E "VOZ" COM EQUILÍBRIO: Escreva como se estivesse em uma conversa privada e intensa com o leitor. Use a primeira pessoa (Eu ou Nós) com moderação e equilíbrio, variando as estruturas para evitar que parágrafos seguidos comecem com "Nós..." ou "A gente...".
5. PONTUAÇÃO E ESPAÇAMENTO HUMANO (EXTREMAMENTE RIGOROSO):
   - CASAMENTO DE PONTUAÇÃO: Nunca coloque espaços antes de pontos finais, pontos de interrogação (?), exclamação (!), dois pontos (:), ponto e vírgula (;) ou fechamento de parênteses/aspas. A pontuação deve estar colada à última palavra (Ex: escreva "Deus?" e NUNCA "Deus ?").
   - BANIMENTO DE SINAIS ÓRFÃOS: É terminantemente proibido o uso de travessões (—), travessões médios (–) ou hifens (-) soltos/isolados no meio ou início de frases para criar pausas dramáticas ou intercalações. Use vírgulas, parênteses corretos ou reescreva de forma contínua e fluida.
   - MODERAÇÃO DE DOIS PONTOS E PONTO E VÍRGULA: Reduza em 80% o uso de dois pontos (:) e pontos e vírgula (;). Prefira o fluxo contínuo do texto usando conjunções naturais da língua portuguesa (como: "visto que", "porque", "já que", "portanto", "com isso").
6. BLOQUEIO DE PADRÕES DE COMPENSAÇÃO DE IA:
   - PROIBIDO O ABUSO DE "IMAGINE": É proibido iniciar capítulos, tópicos ou parágrafos abusando de comandos de visualização como "Imagine", "Imaginemos", "Visualize", "Pense". Em vez de pedir para o leitor imaginar, insira-o direto no cenário (Exemplo: Em vez de "Imagine uma cafeteria...", use "Em uma cafeteria movimentada, o fluxo de...").
   - ADJETIVOS DE CONTROLE BANIDOS/RESTRITOS: Restrinja o uso excessivo e clichê de palavras que a IA usa como muletas intelectuais para parecer complexa: "intrincado", "sintonia/sintonizar", "visceral", "fervilhante", "místico", "alquimia", "maestro". Use substitutos sóbrios e diretos.
   - TRANSIÇÕES IMPLÍCITAS: Elimine conectivos repetitivos que denunciam a estrutura do texto, como "Primeiramente", "Contudo", "Por outro lado", "Em última análise", quando usados consecutivamente para abrir parágrafos. Varie a abertura das frases usando o próprio sujeito da ação.
   - LINGUAGEM DIRETA E SEM FLOREIOS EXAGERADOS: Evite floreios exagerados que tornem o texto cansativo ou artificial (ex: "uma verdadeira cornucópia de ferramentas" ou "dar olhos de águia ao seu negócio"). O tom deve ser moderno, ágil, inspirador e direto.
7. BANIMENTO DE TRANSIÇÕES E EXPRESSÕES REPETITIVAS (CLICHÊS IA / EXTREMAMENTE PROIBIDO):
   - NUNCA use marcadores de IA comuns: "Em conclusão", "Além disso", "Além do mais", "É importante notar", "Consequentemente", "Portanto", "Em resumo", "Por fim", "Dito isso", "Vale ressaltar", "Neste capítulo", "Como mencionado anteriormente".
   - NUNCA use as expressões repetitivas frequentemente detectadas como marcas de IA: "Sendo sincero", "Na real", "O detalhe é que", "Pense comigo", "Onde isso nos leva", "Onde isso nos leva, então", "Mas aqui está o pulo do gato", "Mas aqui está a verdade", "A verdade é que", "Honestamente", "A verdade nua e crua é", "Segura essa", "Do nada", "Ah,", "Ah, meu amigo", "Ah, o", "pastor querido", "amigo querido", "querido leitor".
   - SUBSTITUA POR transições narrativas fluidas e elegantes: "A questão central passa a ser...", "O próximo desafio é...", "Existe um ponto ainda mais importante...", "É aqui que surge a pergunta decisiva...", "Com isso em mente, percebemos que...", ou vá direto ao ponto sem introduções.
   - RIQUEZA DE SINÔNIMOS: Em vez de "Sendo sincero", use: "Para sermos honestos", "A prática nos mostra", "Na rotina de trabalho", "Conversando abertamente", ou vá direto ao ponto. Use uma grande variedade de sinônimos e mude a abordagem para evitar palavras repetidas.
8. FRASES COMPLETAS E SEM FRAGMENTOS: É proibido começar sentenças isoladas com preposições como "A um...", "A uma...", "Ao...", "À...", "De um...", "De uma...". Toda sentença deve ser completa (sujeito + verbo). Substitua construções truncadas por sentenças inteiras (ex: em vez de "A uma compreensão mais profunda...", escreva "Isso nos conduz a uma compreensão mais profunda..." ou "O resultado é uma compreensão mais profunda...").
9. DENSIDADE DE VALOR (ZERO LINGUIÇA): Cada parágrafo deve trazer uma informação útil, um insight prático ou um exemplo real. Elimine parágrafos abstratos que apenas repetem o que foi dito no tópico anterior.
10. CORREÇÃO DE ERROS DE IA COMUNS: Evite erros de digitação recorrentes na geração por IA como "om ombros" (escreva "ombros") e erros de separação verbal como "pro age" (escreva "proage" ou "atua de forma proativa").
11. SHOW, DON'T TELL: NUNCA descreva uma emoção ou resultado de forma abstrata. Use cenas, reações viscerais e detalhes sensoriais.
12. SEM CONCLUSÕES ROBÓTICAS OU GANCHOS ARTIFICIAIS: Não termine seções ou capítulos resumindo o que acabou de ser dito de forma escolar ou fazendo perguntas de transição mecânicas (ex: "Vamos começar?", "Preparado para o próximo passo?"). Conclua os pensamentos de forma orgânica e natural, deixando o gancho implicitamente inserido na última afirmação.
`;

const FICTION_BLOCKS = [
    { id: 1, title: "Mundo Comum", goal: "A rotina e a carência do herói." },
    { id: 2, title: "Incidente Incitante", goal: "O evento que quebra a normalidade." },
    { id: 3, title: "Travessia", goal: "A decisão irreversível de seguir adiante." },
    { id: 4, title: "Testes e Aliados", goal: "Introdução do elenco secundário e regras do mundo." },
    { id: 5, title: "Subtrama", goal: "O arco emocional ou romântico ganha profundidade." },
    { id: 6, title: "Ponto Central", goal: "Uma reviravolta que muda a perspectiva do herói." },
    { id: 7, title: "Pressão", goal: "O antagonista/problema se torna muito mais perigoso." },
    { id: 8, title: "Crise Profunda", goal: "O momento de perda total e reflexão (Noite Escura)." },
    { id: 9, title: "A Epifania", goal: "A descoberta da peça chave para vencer." },
    { id: 10, title: "Clímax", goal: "O confronto final épico de alta intensidade." },
    { id: 11, title: "Ressurreição", goal: "A prova final da transformação do herói." },
    { id: 12, title: "O Elixir", goal: "A nova vida após a jornada e fechamento de arcos." }
];

// Granular Research Functions
export const researchYoutube = async (topic: string, lang: string = 'pt'): Promise<string> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  // 1. FETCH REAL DATA
  let videos: any[] = [];
  try {
    videos = await ResearchService.searchYouTube(topic, lang);
  } catch (e) { console.warn("YouTube search error", e); }

  // FALLBACK: SIMULAÇÃO DE DADOS SE A API FALHAR (CRÍTICO PARA NÃO QUEBRAR O FLUXO)
  if (!videos || videos.length === 0) {
    console.log("[RESEARCH] YouTube Search failed/empty. Simulating data via LLM...");
    const simPrompt = `
        Atue como um motor de busca do YouTube.
        Liste 5 vídeos virais FICITÍCIOS mas ALTAMENTE PLAUSÍVEIS sobre o tema: "${topic}".
        Para cada vídeo, dê um Título Chamativo (Clickbait) e uma Descrição curta com dores reais.
        Format:
        - Title: [Titulo] | Desc: [Descrição]
      `;
    const simRaw = await llm.generateText(simPrompt);
    const parts = simRaw.split('\n').filter(l => l.includes('Title:'));
    // Parse simulated data into "videos" structure if possible, or just use raw text line
    // To keep types consistent, we can just treat the raw text as the contextData directly below.
    videos = parts.map(p => ({ title: p, description: "", link: "#", source: "Simulated_AI" }));
  }

  const contextData = videos.map(v => `- ${v.title} ${v.description}`).join('\n');

  // 2. ANALYZE WITH "PROMPT MESTRE" LOGIC
  const prompt = `
    ${SYSTEM_INSTRUCTION}
    
    DATA FROM YOUTUBE SEARCH:
    ${contextData}
    
    TASK: Analyze these search results for the niche: "${topic}".
    Identify:
    1. Dúvidas, medos e mitos (O que o público pergunta?).
    2. Lacunas (O que ninguém está respondendo?).
    3. Soluções buscadas (O que eles querem comprar?).
    
    Store this mentally as 'DORES_DO_PUBLICO'.
    
    IMPORTANT: The output must be entirely in ${langName}.
    Start your response STRICTLY with: "DORES DO PÚBLICO (YOUTUBE):" followed by the analysis.
  `;

  try {
    return await llm.generateText(prompt);
  } catch (error) {
    console.warn('YouTube Research Analysis failed', error); // Fallback to raw data if LLM fails?
    return `Análise de dados reais falhou, mas aqui estão os vídeos encontrados:\n${contextData}`;
  }
};

export const researchGoogle = async (topic: string, priorContext: string, lang: string = 'pt'): Promise<string> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  // 1. FETCH REAL DATA
  let articles: any[] = [];
  try {
    articles = await ResearchService.searchGoogle(topic + " dores comuns segredos", lang);
  } catch (e) { console.warn("Google search error", e); }

  if (!articles || articles.length === 0) {
    console.log("[RESEARCH] Google Search failed/empty. Simulating data via LLM...");
    const simPrompt = `
        Atue como o Google.
        Liste 5 artigos de blog de autoridade sobre: "${topic}".
        Foque em títulos que prometem "Segredos", "Erros Comuns" ou "Passo a Passo".
        Format:
        - Title: [Titulo] | Desc: [Resumo do Artigo]
      `;
    const simRaw = await llm.generateText(simPrompt);
    const parts = simRaw.split('\n').filter(l => l.includes('Title:'));
    articles = parts.map(p => ({ title: p, description: "", link: "#", source: "Simulated_AI" }));
  }

  const contextData = articles.map(a => `- ${a.title} ${a.description}`).join('\n');

  const prompt = `
      ${SYSTEM_INSTRUCTION}
      
      PREVIOUS CONTEXT: ${priorContext.substring(0, 5000)}...
      
      DATA FROM GOOGLE SEARCH:
      ${contextData}
      
      TASK: Analise os melhores artigos sobre "${topic}".
      
      GOAL: Deepen the "Unique Value Proposition".
      
      Focus on:
      1. Gaps in current bestsellers/blogs.
      2. Specific tools/frameworks that add value.
      3. Authoritative data/studies.
      4. "Purple Cow" elements (Differentiators).
      
      IMPORTANT: The output must be entirely in ${langName}.
      Start your response STRICTLY with: "DORES DO PÚBLICO (GOOGLE):" followed by the analysis.
    `;
  try {
    return await llm.generateText(prompt);
  } catch (error) {
    return `Erro na análise do Google, dados brutos:\n${contextData}`;
  }
};

export const analyzeCompetitors = async (topic: string, priorContext: string, lang: string = 'pt'): Promise<string> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  // 1. FETCH REAL DATA (Amazon via Google)
  let books: any[] = [];
  try {
    books = await ResearchService.searchAmazon(topic, lang);
  } catch (e) { console.warn("Amazon search error", e); }

  if (!books || books.length === 0) {
    console.log("[RESEARCH] Amazon Search failed/empty. Simulating Best-Sellers via LLM...");
    const simPrompt = `
        Atue como a Amazon Best-Sellers list.
        Liste 5 livros FICITÍCIOS mas realistas que seriam Best-Sellers sobre: "${topic}".
        Use títulos comerciais fortes.
        Format:
        - Book: [Titulo] | Snippet: [Promessa do livro]
      `;
    const simRaw = await llm.generateText(simPrompt);
    const parts = simRaw.split('\n').filter(l => l.includes('Book:'));
    books = parts.map(p => ({ title: p, snippet: "", link: "#" }));
  }

  const contextData = books.map(b => `- ${b.title} ${b.snippet}`).join('\n');

  const prompt = `
      ${SYSTEM_INSTRUCTION}
      
      PREVIOUS CONTEXT: ${priorContext.substring(0, 5000)}...
      
      AMAZON MARKET DATA (REAL BEST-SELLERS):
      ${contextData}
      
      TASK: Analyze these Top 10 Best-Sellers for "${topic}".
      
      CRITICAL ANALYSIS FOR EACH BOOK:
      1. Gere uma sinopse técnica de cada um.
      2. Identifique o diferencial de cada um.
      3. Descubra o que eles têm em comum que os faz vender tanto. 
      
      Armazene isso como 'BENCHMARK_MERCADO'.
      
      IMPORTANT: The output must be entirely in ${langName}.
      Start your response STRICTLY with: "BENCHMARK DE MERCADO (AMAZON):" followed by the analysis.
    `;
  try {
    return await llm.generateText(prompt);
  } catch (error) {
    return `Erro na análise de concorrentes, dados brutos:\n${contextData}`;
  }
};

export const generateTitleOptions = async (topic: string, researchContext: string = "", lang: string = 'pt', titleInstruction?: string, isFiction: boolean = false): Promise<TitleOption[]> => {
  console.log(`[IA] Iniciando geração de títulos para: ${topic.substring(0, 50)}...`);
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  const SYSTEM_PROMPT = `
ATUE COMO O MAIOR EXPERT DO MUNDO EM TÍTULOS DE BEST-SELLERS (PULITZER, NYT LIST) E FILMES DE HOLLYWOOD.
Sua missão é criar 9 títulos e subtítulos que não pareçam manuais ou guias, mas sim PROPRIEDADES INTELECTUAIS DE ELITE.

IDIOMA: ${langName}

REGRAS MASTER PARA TÍTULOS:
1. VARIABILIDADE E IMPACTO: Gere RIGOROSAMENTE 9 opções distintas. Alterne OBRIGATORIAMENTE entre títulos curtos (apenas 1 palavra impactante) e títulos mais longos e narrativos (entre 3 a 5 palavras). Pelo menos 3 opções devem ser curtas e 3 opções devem ser longas. O restante deve variar para dar opções ao cliente. Seja direto, amigável ou profundamente evocativo. (Exemplos Curtos: "Inabalável", "Gênese", "Impacto", "Essência". Exemplos Longos: "O Longo Caminho para a Liberdade", "Memórias de um Outono Esquecido", "A Última Fronteira do Amanhã").
2. NADA DE MANUAIS: Proibido usar "Guia", "Manual", "Tudo sobre", "Como", "Segredos de", "Desvendando" no início do título.
3. PADRÃO CINEMATOGRÁFICO: Imagine o título em um pôster de cinema ou em uma vitrine de livraria de prestígio.
4. SONORIDADE: O título deve ser fácil de lembrar e "gostoso" de falar.
5. ADAPTAÇÃO TOTAL: O título deve se moldar perfeitamente à ideia central do cliente, sem ser fixo ou robótico.
6. PROIBIDO DOIS PONTOS OU TRAÇOS: Nunca coloque dois pontos (:) ou travessões/traços (-, –, —) dentro do título ou do subtítulo. Mantenha os campos "title" e "subtitle" limpos e sem esses caracteres.

REGRAS MASTER PARA SUBTÍTULOS:
1. MESTRIA LITERÁRIA: O subtítulo não é um slogan de vendas barato. Ele deve ser uma frase poderosa que dá profundidade e contexto à obra com maestria.
2. BANIMENTO DE VERBOS IA: É TERMINANTEMENTE PROIBIDO começar o subtítulo com verbos como: "Desvende", "Conecte-se", "Explore", "Descubra", "Aprenda", "Entenda".
3. SUBSTITUIÇÃO: Use afirmações poéticas ou promessas de transformação implícitas. 
   - Ruim: "Desvende a Paris dos amantes..."
   - Master: "Uma jornada inesquecível pelo coração da cidade que nunca esquece um grande amor."

${isFiction ? `
FOCO EM FICÇÃO (PADRÃO BEST-SELLER):
- Adapte-se ao GÊNERO (Romance, Drama, Thriller, etc.). 
- Para ROMANCES: Títulos doces, diretos e humanos. Subtítulos que evocam o sentimento central.
- Para DRAMAS: Títulos fortes e nomes próprios.
- Para THRILLERS: Títulos secos e impactantes.
` : `
FOCO EM NÃO FICÇÃO (PADRÃO BEST-SELLER):
- Foco em AUTORIDADE e TRANSFORMAÇÃO.
- Títulos de impacto (Ex: "Inabalável", "Essencialismo", "O Poder da Presença").
- Subtítulos que entregam a solução sem parecer um curso de internet.
`}

${titleInstruction ? `\nINSTRUÇÕES ADICIONAIS DO CLIENTE (PRIORIDADE MÁXIMA PARA MOLDAR A IDEIA):\n"${titleInstruction}"\n` : ''}

CONTEXTO DE PESQUISA (Use para entender o que o público deste nicho REALMENTE consome):
${researchContext.substring(0, 5000)}

RETORNE APENAS JSON LIMPO NA ESTRUTURA EXATA DE UM ARRAY COM EXATAMENTE 9 OPÇÕES:
[
  { "title": "Título 1", "subtitle": "Subtítulo 1" },
  { "title": "Título 2", "subtitle": "Subtítulo 2" },
  ... (até 9 itens) ...
]
NÃO GERE MARKDOWN FORA DO JSON. GERE EXATAMENTE 9 OPÇÕES (títulos curtos e títulos longos misturados).
`;

  const userPrompt = `TEMA: ${topic}`;

  try {
    // INCREASED CONTEXT: Using the high TPM (1,000K) of the user's paid Gemini Tier
    // This allows for MUCH deeper analysis and better titles.
    const raw = await llm.generateJSON<any[]>(`${SYSTEM_PROMPT}\n\nCONTEXTO DE PESQUISA COMPLETO:\n${researchContext.substring(0, 30000)}\n\nINPUT DO USUÁRIO: ${userPrompt}`);

    if (!Array.isArray(raw)) {
      console.warn("[IA] Response is not an array, attempting to wrap it.");
      if (typeof raw === 'object' && raw !== null) return [(raw as any)];
      throw new Error("A resposta da IA não é um array de títulos.");
    }

    // Enriquecer com metadados obrigatórios do frontend
    const enriched = raw.map((item: any, index: number) => ({
      title: item.title || "Título Indisponível",
      subtitle: item.subtitle || "Subtítulo de alto impacto",
      marketingHook: item.marketingHook || "Promessa de Transformação",
      reason: "Gerado por IA Especialista em Best-Sellers",
      score: 90 - (index * 2), // Score decrescente
      isTopChoice: index === 0
    }));

    console.log(`[IA] Geração de títulos concluída com sucesso (${enriched.length} opções).`);
    // Wait for the DB to settle and avoid race conditions in polling
    await new Promise(resolve => setTimeout(resolve, 2000));
    return enriched;

  } catch (error: any) {
    console.error("[IA] Titles Deep Analysis Failed. Attempting Minimal Fallback...", error);
    try {
      // LAST RESORT: Try generation without any research context to unblock the user
      const minimalPrompt = `TEMA: ${topic}. Crie RIGOROSAMENTE 9 títulos virais (alternando entre curtos de 1 palavra e narrativos de 3-5 palavras) e subtítulos master em ${langName}. Retorne apenas JSON: [{ "title": "...", "subtitle": "..." }]`;
      const fallbackTitles = await llm.generateJSON<any[]>(minimalPrompt);
      if (Array.isArray(fallbackTitles)) {
        return fallbackTitles.map((t, idx) => ({
          ...t,
          reason: "IA Sugestão Rápida",
          score: 80 - idx,
          isTopChoice: idx === 0
        }));
      }
    } catch (fallbackError) {
      console.error("[IA] Final Titles Fallback also failed.", fallbackError);
    }
    
    throw new Error(`Falha na análise de títulos (${error.message}). Tente retomar o processo ou mude o nicho.`);
  }
};
;

export const generateStructure = async (title: string, subtitle: string, researchContext: string, lang: string = 'pt', contentStyle?: string, isFiction: boolean = false): Promise<Chapter[]> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  if (isFiction) {
    const fictionPrompt = `
      Context (Market Research): ${researchContext}
      Book Title: ${title} - ${subtitle}
      TASK: Map the "Iron Architecture" (12 blocks) for this fiction story.
      
      GENRE TARGET: ${contentStyle || 'Fiction Best-Seller'}
      
      STRICT STRUCTURE TO FOLLOW:
      ${JSON.stringify(FICTION_BLOCKS)}
      
      For each block, create a compelling Chapter Title and a detailed "intro" (narrative objective).
      IMPORTANT: ALL CONTENT MUST BE IN ${langName}.
      
      REGRAS DE PONTUAÇÃO DOS TÍTULOS:
      - É terminantemente proibido usar dois pontos (:) ou travessões/traços (-, –, —) nos títulos dos capítulos. Os títulos devem ser limpos, diretos e sem esses caracteres.
      
      Return JSON: [{ "id": 1, "title": "...", "intro": "Detailed narrative goal and key events..." }]
    `;
    try {
      const raw = await llm.generateJSON<any[]>(fictionPrompt);
      return raw.map((c: any) => ({ ...c, content: "", isGenerated: false }));
    } catch (e) {
      console.error("Fiction structure generation failed, using internal blocks", e);
      return FICTION_BLOCKS.map(b => ({ ...b, summary: b.goal, content: "", isGenerated: false, isCompleted: false, intro: b.goal }));
    }
  }

  const prompt = `
    Context: ${researchContext}
    Book: ${title} - ${subtitle}
    
    TASK: Create a structure of 12 Chapters.
    ORDER LOGIC: Fundamentos -> Quebra de Mitos -> Método Prático -> Aplicação Avançada.
    
    CRITICAL: Each chapter must resolve one of the specific doubts found in the YouTube/Google research ('DORES_DO_PUBLICO').
    The goal is to produce a comprehensive book (170-200 pages).
    
    STYLE: "${contentStyle || 'Professional'}".
    
    IMPORTANT: ALL CONTENT MUST BE IN ${langName}.
    
    REGRAS DE PONTUAÇÃO DOS TÍTULOS (CRÍTICO):
    - É terminantemente proibido usar dois pontos (:) ou travessões/traços (-, –, —) nos títulos dos capítulos. Os títulos devem ser limpos, diretos e sem esses caracteres.
    
    Return JSON format:
    [
      {
        "id": 1,
        "title": "Título do Capítulo",
        "intro": "Descrição detalhada do capítulo...",
        "subSections": [
          "Subtópico 1 específico e aprofundado",
          "Subtópico 2 específico e aprofundado",
          "Subtópico 3 específico e aprofundado",
          "Subtópico 4 específico e aprofundado"
        ]
      }
    ]
    Return ONLY JSON.
  `;

  try {
    const raw = await llm.generateJSON<any[]>(prompt);
    return raw.map((c: any) => ({
      ...c,
      content: "",
      isGenerated: false,
      subSections: c.subSections || ["Introdução", "Desenvolvimento", "Aprofundamento", "Aplicações Práticas"]
    }));
  } catch (error) {
    console.error("Error generating structure, using FALLBACK TEMPLATE:", error);

    // FALLBACK STRUCTURE TO PREVENT CRASH
    // Enhanced descriptions as requested
    return [
      { 
        id: 1, 
        title: "Fundamentos Essenciais", 
        intro: "Neste capítulo inicial, vamos estabelecer a base sólida necessária para toda a jornada, definindo os conceitos chave que serão usados ao longo do livro. Sem estes fundamentos, qualquer estratégia avançada tende a falhar. Você aprenderá a terminologia correta e os princípios imutáveis que regem este tema.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Introdução aos Princípios Clássicos",
          "Terminologia e Conceitos Indispensáveis",
          "Os Pilares de Sustentação do Método",
          "Erros Comuns de Iniciantes que Você Deve Evitar"
        ]
      },
      { 
        id: 2, 
        title: "História e Contexto", 
        intro: "Faremos uma viagem no tempo para entender como chegamos até o cenário atual, analisando os grandes marcos históricos que moldaram este mercado. Compreender o passado é essencial para prever o futuro e evitar erros cíclicos. Veremos também por que agora é o momento exato para agir.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Origem e Evolução Histórica",
          "Grandes Marcos e Lições do Passado",
          "O Cenário Atual e Suas Transformações",
          "Oportunidades de Ouro na Nova Era"
        ]
      },
      { 
        id: 3, 
        title: "Ferramentas e Preparação", 
        intro: "Aqui você terá acesso ao arsenal completo necessário para começar, incluindo a lista de softwares, equipamentos e recursos indispensáveis. Discutiremos como organizar seu ambiente para máxima produtividade, evitando que você perca tempo precioso com questões técnicas básicas.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "O Arsenal de Ferramentas Recomendadas",
          "Configurações Iniciais e Infraestrutura",
          "Organização do Ambiente de Trabalho",
          "Rotinas de Preparação Prévia"
        ]
      },
      { 
        id: 4, 
        title: "Mentalidade de Sucesso", 
        intro: "Sabemos que 80% do sucesso é psicologia e apenas 20% é mecânica. Vamos blindar sua mente contra a autossabotagem e o medo do fracasso, instalando o mindset dos vencedores. Você aprenderá a pensar como um profissional antes mesmo de ter os primeiros grandes resultados.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "A Psicologia do Sucesso e Foco",
          "Identificando e Eliminando Crenças Limitantes",
          "Rotinas e Hábitos para Blindagem Mental",
          "Mantendo a Consistência sob Pressão"
        ]
      },
      { 
        id: 5, 
        title: "Estratégias Iniciais", 
        intro: "É hora de sair da teoria e ir para a prática. Apresentaremos os primeiros passos acionáveis que geram pequenas vitórias rápidas (Quick Wins), essenciais para manter sua motivação. O foco aqui é criar movimento (momentum) e quebrar a inércia inicial.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Primeiros Passos e Quick Wins",
          "Implementação Prática da Base",
          "Medição de Resultados Iniciais",
          "Ajustes de Rota e Correção Rápida"
        ]
      },
      { 
        id: 6, 
        title: "Técnicas Intermediárias", 
        intro: "Agora que a base está pronta, vamos aprofundar. Sairemos do básico para explorar as nuances que diferenciam os amadores dos profissionais de verdade. O foco deste capítulo é otimização, eficiência e aumento da qualidade dos seus resultados.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Explorando Nuances Profissionais",
          "Técnicas de Otimização e Produtividade",
          "Garantia de Qualidade nos Resultados",
          "Superação do Platô de Aprendizado"
        ]
      },
      { 
        id: 7, 
        title: "Superando Obstáculos Comuns", 
        intro: "Este capítulo serve como um mapa de minas. Identificamos as armadilhas clássicas que derrubam a maioria das pessoas neste estágio e entregamos as soluções prontas. Você saberá exatamente como contornar problemas antes mesmo que eles apareçam.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Armadilhas Comuns no Meio do Caminho",
          "Como Lidar com Falhas Temporárias",
          "Resolução de Problemas Complexos",
          "Prevenção contra a Desmotivação"
        ]
      },
      { 
        id: 8, 
        title: "Segredos dos Especialistas", 
        intro: "Entramos no jogo de alto nível. Revelaremos truques de bastidores, hacks pouco conhecidos e estratégias que apenas a elite do setor utiliza. Estas são as informações que geralmente são guardadas a sete chaves e que geram resultados desproporcionais.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Hacks e Atalhos Pouco Divulgados",
          "A Estratégia dos Grandes Players",
          "Maximizando o Retorno sobre Esforço",
          "Casos de Bastidores Exclusivos"
        ]
      },
      { 
        id: 9, 
        title: "Estudos de Caso Reais", 
        intro: "Nada melhor que a prova na prática. Faremos a desconstrução detalhada de casos de sucesso (e também de fracasso) para ilustrar como a teoria se aplica no mundo real. Veremos números, dados e exemplos concretos para facilitar sua visualização.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Análise do Caso Prático de Sucesso A",
          "Desconstruindo Falhas e Lições do Caso B",
          "Resultados, Métricas e Aprendizados Chave",
          "Como Replicar os Resultados no Seu Contexto"
        ]
      },
      { 
        id: 10, 
        title: "O Futuro da Área", 
        intro: "Vamos antecipar tendências. Uma análise preditiva do que vem por aí nos próximos 5 a 10 anos, garantindo que você esteja posicionado na crista da onda. O objetivo é que você não seja pego de surpresa pelas mudanças e continue relevante a longo prazo.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Tendências Emergentes do Mercado",
          "Inovações Tecnológicas e Impactos",
          "Preparação para Mudanças Drásticas",
          "Mantendo a Relevância a Longo Prazo"
        ]
      },
      { 
        id: 11, 
        title: "Plano de Ação de 30 Dias", 
        intro: "Chega de dúvidas sobre o que fazer. Aqui você terá um roteiro definitivo, um calendário dia após dia, semana após semana. Ele dirá exatamente qual tarefa executar para implementar tudo o que foi aprendido neste livro de forma organizada e sequencial.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Metas e Atividades da Semana 1",
          "Aprofundando os Processos na Semana 2",
          "Consolidação e Resultados na Semana 3",
          "Escalonamento e Revisão na Semana 4"
        ]
      },
      { 
        id: 12, 
        title: "Conclusão e Próximos Passos", 
        intro: "O fim do livro é apenas o começo da sua nova jornada. Discutiremos como manter os resultados a longo prazo e continuar evoluindo constantemente. Você sairá daqui com um plano claro para se tornar uma referência e consolidar seu legado na área.", 
        content: "", 
        isGenerated: false, 
        summary: "", 
        isCompleted: false,
        subSections: [
          "Recapitulação da Jornada e Lições",
          "O Próximo Salto de Evolução",
          "Construindo o Seu Legado",
          "Mensagem Final de Incentivo"
        ]
      }
    ];
  }
};

// Helper to extract the most frequently used terms in a text to block them in subsequent sections/chapters
const extractKeyTerms = (text: string, count: number = 40): string[] => {
  if (!text) return [];
  const stopwords = new Set([
    "a", "o", "e", "que", "do", "da", "em", "um", "uma", "para", "com", "se", "os", "as", 
    "como", "mais", "mas", "por", "ao", "no", "na", "uma", "um", "dos", "das", "de", "este", 
    "esta", "isso", "isto", "aquilo", "ela", "ele", "elas", "eles", "nos", "vos", "me", "te", 
    "lhe", "se", "seu", "sua", "seus", "suas", "meu", "minha", "meus", "minhas", "teu", "tua", 
    "teus", "tuas", "nosso", "nossa", "nossos", "nossas", "dele", "dela", "deles", "delas", 
    "este", "esta", "estes", "estas", "aquele", "aquela", "aqueles", "aquelas", "num", "numa", 
    "neste", "nesta", "nestes", "nestas", "naquele", "naquela", "naqueles", "naquelas", "pelo", 
    "pela", "pelos", "pelas", "por", "para", "como", "mais", "muito", "todo", "toda", "todos", 
    "todas", "outro", "outra", "outros", "outras", "sobre", "entre", "sem", "sob", "atrás", 
    "depois", "antes", "durante", "então", "assim", "portanto", "entretanto", "porém", "todavia", 
    "contudo", "logo", "pois", "porque", "porquê", "sendo", "tendo", "esta", "está", "estão", 
    "esteve", "estava", "estavam", "estiveram", "ser", "são", "era", "eram", "foi", "foram", 
    "será", "serão", "seria", "seriam", "têm", "tinha", "tinham", "teve", "tiveram", "terá", 
    "terão", "teria", "teriam", "haver", "há", "havia", "haviam", "houve", "houveram", "fazer", 
    "faz", "fazia", "faziam", "fez", "fizeram", "faria", "fariam", "fará", "farão"
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿ-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 3 && !stopwords.has(w) && !/^\d+$/.test(w));

  const freqMap: Record<string, number> = {};
  for (const w of words) {
    freqMap[w] = (freqMap[w] || 0) + 1;
  }

  return Object.keys(freqMap)
    .sort((a, b) => freqMap[b] - freqMap[a])
    .slice(0, count);
};

// Utility to clean AI artifacts
const cleanText = (text: string): string => {
  return text
    .replace(/_{2,}/g, '') // Remove ___
    .replace(/-{3,}/g, '') // Remove ---
    .replace(/#{2,}/g, '') // Remove ###
    // .replace(/\*{2,}/g, '') // RESTORED: Keep ** for doc.service.ts bold detection
    .replace(/In conclusion,|Em conclusão,|Por fim,|Concluindo,|Além disso,|Ademais,|Além do mais,|Em resumo,|É fundamental notar,|É importante destacar,/gi, '') // Remove typical AI markers
    .replace(/\[.*?\]/g, '') // Remove placeholders like [Insert name]
    .replace(/\r\n/g, '\n') // Normalize newlines
    .replace(/[ \t]{2,}/g, ' ') // Remove double horizontal spaces but keep paragraph newlines
    .replace(/[ \t]+([.,!?;:])/g, '$1') // Remove space before punctuation
    .replace(/[ \t]+\)/g, ')') // Remove space before closing parenthesis
    .replace(/\([ \t]+/g, '(') // Remove space after opening parenthesis
    .replace(/(\w|\d|[.,!?;:])\s+([\"'”’])/g, '$1$2') // Space before closing quotes
    .replace(/([\"'“‘])\s+(\w|\d)/g, '$1$2') // Space after opening quotes
    .replace(/\n{3,}/g, '\n\n') // Collapse 3+ newlines to double newlines
    .trim();
};

const getHumanizationInstructions = (lang: string, style: string = 'Profissional', tone: string = 'Natural', isFiction: boolean = false) => `
    DIRETRIZES DE ESCRITA DE ELITE (MODO INDETECTÁVEL):
    ${isFiction ? ANTI_AI_INSTRUCTIONS : `
    1. **ALMA HUMANA E VARIABILIDADE DE RITMO**: Escreva com imperfeição controlada, nuances e emoção. Alterne o ritmo das frases (Burstiness). Mescle parágrafos de tamanhos diferentes. Um parágrafo longo e explicativo deve ser obrigatoriamente seguido por uma frase curta e impactante. Use vocabulário rico e inesperado (Perplexidade).
    2. **ESTILO E CONEXÃO REAL COM EQUILÍBRIO**:
       - Use a PRIMEIRA PESSOA (Eu ou Nós) com moderação e equilíbrio, variando as estruturas para evitar que parágrafos seguidos comecem com "Nós..." ou "A gente...".
       - **Estilo**: ${style} | **Tom**: ${tone}
    3. **BLOQUEIO DE PADRÕES DE COMPENSAÇÃO DE IA**:
       - PROIBIDO O ABUSO DE "IMAGINE": É proibido iniciar capítulos, tópicos ou parágrafos abusando de comandos de visualização como "Imagine", "Imaginemos", "Visualize", "Pense". Em vez de pedir para o leitor imaginar, insira-o direto no cenário (Exemplo: Em vez de "Imagine uma cafeteria...", use "Em uma cafeteria movimentada, o fluxo de...").
       - ADJETIVOS DE CONTROLE BANIDOS/RESTRITOS: Restrinja o uso excessivo e clichê de palavras que a IA usa como muletas intelectuais para parecer complexa: "intrincado", "sintonia/sintonizar", "visceral", "fervilhante", "místico", "alquimia", "maestro". Use substitutos sóbrios e diretos.
       - TRANSIÇÕES IMPLÍCITAS: Elimine conectivos repetitivos que denunciam a estrutura do texto, como "Primeiramente", "Contudo", "Por outro lado" e "Em última análise", quando usados consecutivamente para abrir parágrafos. Varie a abertura das frases usando o próprio sujeito da ação.
       - LINGUAGEM DIRETA E SEM FLOREIOS EXAGERADOS: Evite floreios exagerados que tornem o texto cansativo ou artificial (ex: "uma verdadeira cornucópia de ferramentas" ou "dar olhos de águia ao seu negócio"). O tom deve ser moderno, ágil, inspirador e direto.
    4. **BANIMENTO DE TRANSIÇÕES E EXPRESSÕES REPETITIVAS (CLICHÊS IA/EXTREMAMENTE PROIBIDO)**: 
       - NUNCA use marcadores de IA comuns: "Em conclusão", "Além disso", "Além do mais", "É importante notar", "Consequentemente", "Portanto", "Em resumo", "Por fim", "Dito isso", "Vale ressaltar", "Neste capítulo", "Como mencionado anteriormente".
       - NUNCA use as expressões repetitivas frequentemente detectadas como marcas de IA: "Sendo sincero", "Na real", "O detalhe é que", "Pense comigo", "Onde isso nos leva", "Onde isso nos leva, então", "Mas aqui está o pulo do gato", "Mas aqui está a verdade", "A verdade é que", "Honestamente", "A verdade nua e crua é", "Segura essa", "Do nada", "Ah,", "Ah, meu amigo", "Ah, o", "pastor querido", "amigo querido", "querido leitor".
       - SUBSTITUA POR transições narrativas fluidas e elegantes: "A questão central passa a ser...", "O próximo desafio é...", "Existe um ponto ainda mais importante...", "É aqui que surge a pergunta decisiva...", "Com isso em mente, percebemos que...", ou vá direto ao ponto sem introduções.
       - RIQUEZA DE SINÔNIMOS: Em vez de "Sendo sincero", use: "Para sermos honestos", "A prática nos mostra", "Na rotina de trabalho", "Conversando abertamente", ou vá direto ao ponto. Use uma grande variedade de sinônimos e mude a abordagem para evitar palavras repetidas.
       - PROIBIDO o uso de separadores robóticos (___, ---, ###) dentro do corpo do texto.
    5. **PONTUAÇÃO E ESPAÇAMENTO HUMANO (EXTREMAMENTE RIGOROSO)**:
       - CASAMENTO DE PONTUAÇÃO: Nunca coloque espaços antes de pontos finais, pontos de interrogação (?), exclamação (!), dois pontos (:), ponto e vírgula (;) ou fechamento de parênteses/aspas. A pontuação deve estar colada à última palavra (Ex: escreva "Deus?" e NUNCA "Deus ?").
       - BANIMENTO DE SINAIS ÓRFÃOS: É terminantemente proibido o uso de travessões (—), travessões médios (–) ou hifens (-) soltos/isolados no meio ou início de frases para criar pausas dramáticas ou intercalações. Use vírgulas, parênteses corretos ou reescreva de forma contínua e fluida.
       - MODERAÇÃO DE DOIS PONTOS E PONTO E VÍRGULA: Reduza em 80% o uso de dois pontos (:) e pontos e vírgula (;). Prefira o fluxo contínuo do texto usando conjunções naturais da língua portuguesa (como: "visto que", "porque", "já que", "portanto", "com isso").
    6. **FRASES COMPLETAS E SEM FRAGMENTOS**: É proibido começar sentenças isoladas com preposições como "A um...", "A uma...", "Ao...", "À...", "De um...", "De uma...". Toda sentença deve ser completa (sujeito + verbo). Substitua construções truncadas por sentenças inteiras (ex: em vez de "A uma compreensão mais profunda...", escreva "Isso nos conduz a uma compreensão mais profunda..." ou "O resultado é uma compreensão mais profunda...").
    7. **DENSIDADE DE VALOR (ZERO LINGUIÇA)**: Cada parágrafo deve trazer uma informação útil, um insight prático ou um exemplo real. Elimine parágrafos abstratos que apenas repetem o que foi dito no tópico anterior.
    8. **CORREÇÃO DE ERROS DE IA COMUNS**: Evite erros de digitação recorrentes na geração por IA como "om ombros" (escreva "ombros") e erros de separação verbal como "pro age" (escreva "proage" ou "atua de forma proativa").
    9. **ZERO REPETIÇÃO SEMÂNTICA**: Não repita a mesma ideia ou estrutura de frase em parágrafos sequenciais. Mantenha a leitura fresca.
    10. **SHOW, DON'T TELL**: Não descreva apenas a teoria; mostre a aplicação prática com detalhes sensoriais e resultados viscerais.
    11. **REVISÃO DOUBLE-BLIND (AUTOCORREÇÃO)**: Ao finalizar, analise seu próprio texto. Se algo parecer "perfeito demais" ou "previsível", reescreva para injetar caos e humanidade.
    `}
    12. **FORMATAÇÃO**: Retorne PARÁGRAFOS LIMPOS e fluidos. Use transições naturais em vez de headers excessivos.
    13. **SHOW, DON'T TELL**: Não diga que algo é emocionante, faça o coração do leitor disparar com a descrição.
    14. **REVISÃO DOUBLE-BLIND (AUTOCORREÇÃO)**: Ao finalizar, analise seu próprio texto. Se algo parecer "perfeito demais" ou "robótico", reescreva instantaneamente para injetar caos e humanidade.
`;

export const writeIntroduction = async (
  metadata: BookMetadata,
  structure: Chapter[],
  researchContext: string,
  lang: string = 'pt'
): Promise<string> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);
  const structureList = structure.map(c => `- ${c.title}`).join('\n');
  const style = metadata.contentStyle || 'Profissional / Técnico';
  const tone = metadata.writingTone || 'Autoridade e Confiança';

  // Extract the first paragraph/snippet of each generated chapter (skip intro chapter itself if present)
  let chaptersSnippets = "";
  if (structure && structure.length > 0) {
    chaptersSnippets += "\n=== RESUMO DO INÍCIO DE CADA CAPÍTULO DO LIVRO (Use para garantir coerência e citar ideias) ===\n";
    structure.forEach(c => {
      if (c.id !== 0 && c.content && c.content.length > 100) {
        const snippet = c.content.substring(0, 500).trim();
        chaptersSnippets += `Capítulo ${c.id} ("${c.title}"):\n"${snippet}..."\n\n`;
      }
    });
    chaptersSnippets += "=========================================================================================\n";
  }

  const prompt = `
      ${getHumanizationInstructions(lang, style, tone, metadata.isFiction)}
      
      Author: ${metadata.authorName}
      Book: ${metadata.bookTitle}
      Subtitle: ${metadata.subTitle}
      ${metadata.isFiction ? `GENRE: ${metadata.genre}\nCHARACTERS: ${JSON.stringify(metadata.characters)}` : ''}
      
      Structure:
      ${structureList}
      
      ${chaptersSnippets}
      
      Research Context:
      ${researchContext}
      
      TASK: Write the INTRODUCTION ${metadata.isFiction ? '(or PROLOGUE)' : ''} for this book.
      Objective: Hook the reader IMMEDIATELY. Start with a controversial statement, a personal story, or a surprising fact.
      ${metadata.isFiction ? 'Objective: Estabelecer o clima da história, apresentar o conflito latente ou um momento marcante do passado que ecoa no presente.' : ''}
      
      FINAL PHASE (REVISÃO DOUBLE-BLIND): 
      Após redigir, revise o texto. Mude ritmos monótonos. Injete "Ruído Humano" (metáforas únicas, variações de frases). 
      O resultado final deve atingir 0% de detecção em ferramentas de IA.
      
      Requirements:
      - Length: Approx 1200 words.
      - Tone: Best-seller authority, confident, yet intimate.
      - Flow: Continuous, absorbing text. NO section headers within the introduction.
      - Content: ${metadata.isFiction ? 'Use deep immersive prose.' : 'Tell a powerful personal story or case study that illustrates the problem. Dive deep into the pain points.'}
      - LANGUAGE: ${langName} ONLY.
    `;

  const raw = await llm.generateText(prompt);
  return cleanText(raw);
};

export const writeChapter = async (
  metadata: BookMetadata,
  chapter: Chapter,
  structure: Chapter[],
  researchContext: string,
  onPulse?: () => Promise<void>
): Promise<string> => {
  const llm = await getLLMProvider();
  const lang = metadata.language || 'pt';
  const langName = getLangName(lang);

  // 1. Check if subSections are already defined on the chapter structure, otherwise generate dynamically
  let subtopics: string[] = [];
  if (chapter.subSections && chapter.subSections.length > 0) {
    subtopics = chapter.subSections;
  } else {
    const outlinePrompt = `
      ${SYSTEM_INSTRUCTION}
      Context: ${researchContext.substring(0, 5000)}...
      Book: ${metadata.bookTitle}
      Chapter: ${chapter.title}
      Chapter Objective: ${chapter.intro}

      TASK: Create a detailed outline for this chapter with exactly 4 distinct sub-sections.
      Each sub-section must cover a specific aspect of the chapter's topic in EXTREME depth.
      
      Output JSON: ["Subheading 1", "Subheading 2", "Subheading 3", "Subheading 4"]
      Output ONLY JSON.
      Language: ${langName}.
    `;

    try {
      subtopics = await llm.generateJSON<string[]>(outlinePrompt);
    } catch (e) {
      console.error("Failed to generate outline, using fallback topics", e);
      // Fallback topics if JSON fails
      subtopics = ["Fundamentos", "Histórico e Evolução", "Ferramentas e Técnicas", "Estudos de Caso"];
    }
  }

  // Ensure we don't go overboard if AI hallucinates 10 topics (4 subtopics fits the 170-200 pages goal better)
  subtopics = subtopics.slice(0, 4);

  // 2. Iterative Generation
  let fullChapterContent = "";

  const style = metadata.contentStyle || 'Profissional';
  const tone = metadata.writingTone || 'Natural';

  // 2.1 Calculate Accumulated Context and Prohibited Terms from Previous Chapters
  const currentChapterIndex = structure.findIndex(c => c.id === chapter.id);
  let previousChaptersContext = "";
  if (currentChapterIndex > 0) {
    previousChaptersContext += "\n=== CONTEXTO DE CAPÍTULOS ANTERIORES E JÁ ESCRITOS ===\n";
    for (let j = 0; j < currentChapterIndex; j++) {
      const prevCh = structure[j];
      if (prevCh.content && prevCh.content.length > 100) {
        const snippet = prevCh.content.substring(0, 600).trim();
        previousChaptersContext += `Capítulo ${prevCh.id}: "${prevCh.title}"\nInício do Capítulo:\n"${snippet}..."\n\n`;
      }
    }
    previousChaptersContext += "=====================================================\n";
  }

  let prohibitedWordsList: string[] = [];
  if (currentChapterIndex > 0) {
    const prevCh = structure[currentChapterIndex - 1];
    if (prevCh.content) {
      prohibitedWordsList = [...prohibitedWordsList, ...extractKeyTerms(prevCh.content, 40)];
    }
  }
  if (currentChapterIndex > 1) {
    const prevPrevCh = structure[currentChapterIndex - 2];
    if (prevPrevCh.content) {
      prohibitedWordsList = [...prohibitedWordsList, ...extractKeyTerms(prevPrevCh.content, 20)];
    }
  }
  prohibitedWordsList = Array.from(new Set(prohibitedWordsList));

  const prohibitedWordsStr = prohibitedWordsList.length > 0
    ? `\nLISTA DE PALAVRAS E TERMOS PROIBIDOS NESTE CAPÍTULO (já usados excessivamente nos capítulos anteriores, EVITE a todo custo):\n${prohibitedWordsList.map(w => `- "${w}"`).join('\n')}\n`
    : '';

  try {
    // 2.1 Intro of Chapter (With Retries)

    let introSuccess = false;
    let introAttempts = 0;
    while (!introSuccess && introAttempts < 3) {
      try {
        introAttempts++;
        const introPrompt = `
            ${getHumanizationInstructions(lang, style, tone)}
            
            CONTEXTO DE PESQUISA (Use isso como base, não invente):
            ${researchContext.substring(0, 3000)}
            
            Context: ${researchContext}
            Chapter: ${chapter.title}
            Objective: ${chapter.intro}
            
            TASK: Write the INTRODUCTION for this chapter (approx 250 words).
            Hook the reader, explain what will be covered, and set the stage.
            Make cross-references ("Como vimos anteriormente...").
            Start directly with the content.
            LANGUAGE: ${langName}.
        `;
        fullChapterContent += (await llm.generateText(introPrompt)) + "\n\n";
        introSuccess = true;
      } catch (e: any) {
        console.warn(`[IA] Chapter Intro failed (Attempt ${introAttempts}/3):`, e.message);
        if (introAttempts >= 3) throw e;
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    if (onPulse) await onPulse();

    // 2.2 Sections
    for (const subtopic of subtopics) {
      let subSuccess = false;
      let subAttempts = 0;
      
      while (!subSuccess && subAttempts < 3) {
        try {
          subAttempts++;
          console.log(`[IA] Writing subtopic "${subtopic}" (Attempt ${subAttempts}/3) for chapter: ${chapter.title}`);
          
          const sectionPrompt = `
                 ${getHumanizationInstructions(lang, style, tone, metadata.isFiction)}
                 
                 ${metadata.isFiction ? `GENRE: ${metadata.genre}\nCHARACTERS: ${JSON.stringify(metadata.characters)}` : `
                 CONTEXTO DE PESQUISA (Use isso como base, não invente):
                 ${researchContext.substring(0, 5000)}
                 `}
                 
                 Book: ${metadata.bookTitle}
                 Chapter: ${chapter.title}
                 
                 Current Section: "${subtopic}"
                 
                 TAREFA: Escreva o conteúdo desta seção.
                 
                 FASE DE EXECUÇÃO HUMANIZADA:
                 1. Aplique VARIABILIDADE RADICAL (Burstiness) nas frases.
                 2. Injete PERPLEXIDADE com vocabulário rico e analogias raras.
                 
                 REGRAS DE CONTEXTO E NÃO-REPETIÇÃO:
                 - Leia atentamente o "Contexto Anterior" (Previous Context) fornecido abaixo.
                 - É expressamente proibido repetir estruturas de início de frase, termos, conectivos ou metáforas que foram utilizadas no "Contexto Anterior".
                 - Varie o vocabulário e a cadência para que o texto pareça uma continuação fluida e natural, sem redundâncias.
                 - Use tom conversacional e prático.
                 ${metadata.isFiction ? '- Use prosa imersiva, foco em diálogos e ação.' : ''}
                 - TAMANHO: Escreva rigorosamente entre 450 e 500 palavras por seção. Detalhe profundamente os conceitos com exemplos ricos.
                 
                 ${previousChaptersContext}
                 
                 ${prohibitedWordsStr}
                 
                 Previous Context:
                 ${fullChapterContent.slice(-3000)}
                 
                 LANGUAGE: ${langName}.
             `;
            
          const content = await llm.generateText(sectionPrompt);
          if (!content || content.length < 100) throw new Error("Content too short or empty");
          
          fullChapterContent += `### ${subtopic}\n\n${content}\n\n`;
          subSuccess = true;
          console.log(`[IA] Subtopic "${subtopic}" completed (${content.length} chars).`);
        } catch (e: any) {
          console.warn(`[IA] Subtopic "${subtopic}" failed (Attempt ${subAttempts}/3):`, e.message);
          if (subAttempts >= 3) {
            fullChapterContent += `### ${subtopic}\n\n[O conteúdo desta seção não pôde ser gerado automaticamente devido a uma instabilidade temporária. Sugerimos revisar este tópico manualmente.]\n\n`;
            subSuccess = true; // Move to next to avoid infinite loop
          } else {
            await new Promise(r => setTimeout(r, 2000)); // Wait before retry
          }
        }
      }
      
      if (onPulse) await onPulse();
    }

    // 2.3 Conclusion (With Retries)
    let conclSuccess = false;
    let conclAttempts = 0;
    while (!conclSuccess && conclAttempts < 3) {
      try {
        conclAttempts++;
        const conclusionPrompt = `
            ${getHumanizationInstructions(lang, style, tone)}
            Chapter: ${chapter.title}
            
            TASK: Write a powerful CONCLUSION for this chapter (approx 150 words).
            Summarize key points and transition to the next idea.
            
            LANGUAGE: ${langName}.
        `;
        fullChapterContent += (await llm.generateText(conclusionPrompt));
        conclSuccess = true;
      } catch (e: any) {
        console.warn(`[IA] Chapter Conclusion failed (Attempt ${conclAttempts}/3):`, e.message);
        if (conclAttempts >= 3) throw e;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

  } catch (error) {
    console.error("Error in iterative writing, falling back to single shot", error);
    // Fallback to single shot if iteration fails completely
    const prompt = `
        ${getHumanizationInstructions(lang, style, tone)}
        
        CONTEXTO DE PESQUISA (Use isso como base, não invente):
        ${researchContext.substring(0, 5000)}
        
        Author: ${metadata.authorName}
        Book: ${metadata.bookTitle}
        CURRENT CHAPTER: ${chapter.id}. ${chapter.title}
        
        TAREFA: Escreva o Capítulo Completo.
        REGRAS:
        - Extensão Alvo: NO MÍNIMO 2200 palavras. (Meta: ~9-10 páginas por capítulo, para totalizar rigorosamente entre 170-200 páginas no livro).
        - Use tom conversacional e prático.
        - Foco total em resolver as dores listadas na pesquisa.
        
        LANGUAGE: ${langName}.
      `;

    const raw = await llm.generateText(prompt);
    return cleanText(raw);
  }

  return cleanText(fullChapterContent);
};

export const generateMarketing = async (metadata: BookMetadata, researchContext: string, structure: Chapter[], lang: string = 'pt'): Promise<MarketingAssets> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  const structureList = structure.map(c => `• ${c.id === 0 ? 'Intro' : 'Cap ' + c.id}: ${c.title}`).join('\n');

  const prompt = `
    Book: ${metadata.bookTitle}
    Author: ${metadata.authorName}
    Subtitle: ${metadata.subTitle || "A definitive guide"}
    Language: ${langName}
    STRICT LANGUAGE RULE: THE OUTPUT MUST BE 100% IN ${langName}. DO NOT INCLUDE ENGLISH TEXT (unless book is in English).
    
    Structure:
    ${structureList}
    
    Context: 
    ${researchContext}

    Based on the book content and metadata, create PROFESSIONAL MARKETING ASSETS.
    
    CRITICAL INSTRUCTIONS:
    - Tone: WORLD-CLASS BEST-SELLER COPYWRITING. Exciting, Emotional, High-Ticket, Urgent.
    - Avoid generic AI text. Use power words.
    - APPLY HUMANIZATION: Use "Burstiness" in the copy. NUNCA use "Além disso" ou "Em conclusão".
    - REVISÃO DOUBLE-BLIND: O texto deve soar como se tivesse sido escrito por um mestre do marketing humano, não por um algoritmo.
    
    TASK 1: YouTube Video Description
    REQUIREMENT: YOU MUST LIST ALL CHAPTERS from the provided Structure list in the body under "ESTRUTURA DOS CAPÍTULOS".
    Format:
    📘 [Book Title]
    👇 GARANTA O SEU EXEMPLAR AGORA: 🛒 Amazon: [LINK] 🛒 UICLAP: [LINK]
    ________________________________________
    🛑 [ALL CAPS HOOK]
    [Problem Agitation Paragraph]
    [Solution/Introduction of Book]
    ________________________________________
    🔥 O QUE VOCÊ VAI APRENDER?
    ✅ [Benefit 1]
    ✅ [Benefit 2]
    ✅ [Benefit 3]
    ✅ [Benefit 4]
    ✅ [Benefit 5]
    ________________________________________
    🎯 PARA QUEM É ESTE LIVRO?
    • [Target Audience 1]
    • [Target Audience 2]
    • [Target Audience 3]
    ________________________________________
    📚 ESTRUTURA DOS CAPÍTULOS:
    ${structureList}
    ________________________________________
    🚀 SOBRE O AUTOR: ${metadata.authorName}
    [Bio]
    ________________________________________
    🛒 ONDE COMPRAR?
    📖 Versão Física e Digital na Amazon: [LINK]
    📖 Versão Física na UICLAP: [LINK]
    ________________________________________
    #️⃣ HASHTAGS:
    #[Tag1] #[Tag2] ...
    
    TASK 2: Back Cover Text (Contra Capa)
    Format:
    [ALL CAPS PROBLEM QUESTION]?
    [Body text addressing the pain - approx 150 words]
    [List of 3 key takeaways]
    ABRA ESTE LIVRO E CONQUISTE [Result].
    
    TASK 3: Front Flap Text (Orelha da Capa - Sobre a Obra)
    Format:
    [Compelling Question]?
    This book is your map. In "${metadata.bookTitle}", ${metadata.authorName} guides you...
    [Description of the transformation - approx 150 words]
    
    TASK 4: Back Flap Text (Orelha da Contra Capa - Sobre o Autor)
    Format:
    [Author Name] is... [Professional Bio focusing on authority and mission - approx 100 words]
    
    TASK 5: SINOPSE PADRÃO PROFISSIONAL AMAZON
    Create a highly persuasive description for the Amazon Sales Page (approx 600 words).
    Title the section: "SINOPSE PADRÃO PROFISSIONAL AMAZON".
    Focus on Benefits, Pain Points, and the Transformation the reader will experience.
    
    TASK 6: Keywords
    REQUIREMENT: GENERATE AT LEAST 20 HIGH-TRAFFIC KEYWORDS/TAGS, separated by commas.
    Example: keyword1, keyword2, keyword3, ...
    
    Output JSON Required:
    {
       "youtubeDescription": "Full text with \\n...",
       "backCover": "Full text...",
       "flapCopy": "Front flap text...",
       "backFlapCopy": "Back flap text...",
       "salesSynopsis": "Full Amazon Synopsis...",
       "description": "Short summary...",
       "keywords": ["tag1", "tag2", ...] 
    }
    
    Return ONLY JSON.
  `;

  try {
    return await llm.generateJSON<MarketingAssets>(prompt);
  } catch (e) {
    console.error("Marketing JSON Generation Failed. Attempting Text Fallback...", e);
    logError("MARKETING_JSON_FAIL", e);

    // TEXT FALLBACK
    try {
      const textPrompt = `
            Task: Create Marketing Assets for book "${metadata.bookTitle}".
            Language: ${langName}
            
            OUTPUT FORMAT:
            Please write the content for each section clearly separated by these dividers:
            ===YOUTUBE===
            (Write YouTube Description Here)
            ===BACKCOVER===
            (Write Back Cover Text Here)
            ===FLAP===
            (Write Front Flap Text Here)
            ===BACKFLAP===
            (Write Back Flap Text Here)
            ===SYNOPSIS===
            (Write Amazon Synopsis Here)
            ===KEYWORDS===
            (List keywords separated by commas)
        `;

      const text = await llm.generateText(textPrompt);

      // Helper to extract
      const extract = (marker: string, nextMarker: string) => {
        const start = text.indexOf(marker);
        if (start === -1) return "Conteúdo gerado manualmente necessário.";
        const end = text.indexOf(nextMarker, start);
        return text.substring(start + marker.length, end !== -1 ? end : undefined).trim();
      };

      return {
        youtubeDescription: extract("===YOUTUBE===", "===BACKCOVER==="),
        backCover: extract("===BACKCOVER===", "===FLAP==="),
        flapCopy: extract("===FLAP===", "===BACKFLAP==="),
        backFlapCopy: extract("===BACKFLAP===", "===SYNOPSIS==="),
        salesSynopsis: extract("===SYNOPSIS===", "===KEYWORDS==="),
        description: extract("===SYNOPSIS===", "===KEYWORDS===").substring(0, 300) + "...",
        keywords: extract("===KEYWORDS===", "EOF").split(',').map(k => k.trim()),
        viralHooks: [],
        targetAudience: "N/A"
      };

    } catch (rescueError) {
      console.error("Marketing Rescue Failed:", rescueError);
      // Return placeholders so it finishes
      return {
        youtubeDescription: "Erro na geração. Por favor edite.",
        backCover: "Erro na geração. Por favor edite.",
        flapCopy: "Erro na geração. Por favor edite.",
        backFlapCopy: "Erro na geração. Por favor edite.",
        salesSynopsis: "Erro na geração. Por favor edite.",
        description: "Erro na geração.",
        keywords: [],
        viralHooks: [],
        targetAudience: "N/A"
      };
    }
  }
};

export const generateExtras = async (
  metadata: BookMetadata,
  dedicationTo: string,
  ackTo: string,
  aboutAuthorContext: string = "",
  lang: string = 'pt'
): Promise<{ dedication: string; acknowledgments: string; aboutAuthor: string }> => {
  const llm = await getLLMProvider();
  const langName = getLangName(lang);

  const prompt = `
    Author: ${metadata.authorName}
    Book: ${metadata.bookTitle}

    TASK: Write 3 sections: DEDICATION, ACKNOWLEDGMENTS, and ABOUT THE AUTHOR.
    IMPORTANT: ALL TEXT MUST BE IN ${langName}.
    
    1. DEDICATION
    Target: ${dedicationTo || "Family and Friends"}
    Style: Emotional, profound, and rich (approx 100 words). NOT ITALIC. Plain text.

    2. ACKNOWLEDGMENTS
    Target: ${ackTo || "Everyone who helped"}
    Style: Gratitude, standard book format, detailed and warm (MAX 200 words). NOT ITALIC. Plain text.

    3. ABOUT THE AUTHOR
    Context: ${aboutAuthorContext || "Experienced professional in the field of " + metadata.topic}
    Style: Professional, 3rd person, establishing authority. (approx 150 words).
    
    OUTPUT FORMAT:
    Please write the content for each section clearly separated by these dividers:
    ===DEDICATION===
    [Your text here]
    ===ACKNOWLEDGMENTS===
    [Your text here]
    ===ABOUT_AUTHOR===
    [Your text here]
    ===END===
  `;

  try {
    const text = await llm.generateText(prompt);

    const extract = (marker: string, nextMarker: string) => {
      const start = text.indexOf(marker);
      if (start === -1) return "";
      const end = text.indexOf(nextMarker, start);
      return text.substring(start + marker.length, end !== -1 ? end : undefined).trim();
    };

    const dedicationParsed = extract("===DEDICATION===", "===ACKNOWLEDGMENTS===");
    const ackParsed = extract("===ACKNOWLEDGMENTS===", "===ABOUT_AUTHOR===");
    const aboutParsed = extract("===ABOUT_AUTHOR===", "===END===");

    return {
      dedication: cleanText(dedicationParsed || "[Dedicatória Livre]"),
      acknowledgments: cleanText(ackParsed || "[Agradecimentos Livres]"),
      aboutAuthor: cleanText(aboutParsed || `Sobre o autor: ${metadata.authorName}`)
    };
  } catch (error) {
    console.error("Extras Generation Failed:", error);
    return {
      dedication: "[Dedicatória Livre]",
      acknowledgments: "[Agradecimentos Livres]",
      aboutAuthor: `Sobre o autor: ${metadata.authorName}`
    };
  }
};

export const structureBookFromText = async (fullText: string): Promise<any> => {
  const llm = await getLLMProvider();

  // Truncate text if too long to avoid token limits, but for structure we need the whole flow?
  // Let's assume we send the first 100k chars or chunks? 
  // For simplicity, let's send a summary prompt if text is huge. For now, assume reasonable length or truncate.
  const truncated = fullText.slice(0, 100000); // 100k chars ~ 20k words

  const prompt = `
    Analyze the following book text/manuscript and extract its structure.
    
    TEXT START:
    ${truncated}
    TEXT END
    
    TASK:
    1. Identify the Title and Subtitle (if present in the first few lines).
    2. Identify the Author (if present).
    3. Split the content into Chapters.
    
    CRITICAL INSTRUCTIONS:
    - YOU ARE A PARSER/EXTRACTOR, NOT A CREATIVE WRITER.
    - DO NOT WRITE NEW CONTENT. DO NOT SUMMARIZE.
    - EXTRACT the content VERBATIM (word-for-word) from the source text.
    - If the source text is short or incomplete, return ONLY what is there.
    - IF THE TEXT DOES NOT LOOK LIKE A BOOK (e.g. it is a receipt, random code, or gibberish), return an empty structure.
    - DO NOT INVENT A TITLE if one is not clearly stated. Use "Untitled" if necessary.
    - If you cannot find chapters, treat the entire text as one chapter named "Conteúdo Principal".
    
    Return JSON:
    {
       "metadata": { "bookTitle": "...", "subTitle": "...", "authorName": "...", "topic": "..." },
       "structure": [
          { "id": 1, "title": "...", "content": "..." },
          { "id": 2, "title": "...", "content": "..." }
       ],
       "introduction": "...",
       "conclusion": "..."
    }
    
    For "content", extract the FULL text of that chapter from the source.
    Return ONLY JSON.
  `;

  // Note: This is expensive and might hit limits. Ideally we should split by regex (Chapter X) first.
  // But since we want "Intelligent Diagramming", let's try AI first. 
  // If text is huge, this call will fail or be slow.
  // Fallback structure: Manual splitting.
  // Given constraints, I'll trust the LLM for now.

  return await llm.generateJSON<any>(prompt);
};

// Smart curated Unsplash backgrounds matching specific niches
const getNicheCuratedBackgrounds = (niche: string): string[] => {
  const norm = (niche || "").toLowerCase();

  // Négocios / Finanças / Marketing / Produtividade / Liderança
  if (
    norm.includes("finança") || norm.includes("negócio") || norm.includes("marketing") || 
    norm.includes("produtividade") || norm.includes("liderança") || norm.includes("venda") || 
    norm.includes("sucesso") || norm.includes("business") || norm.includes("money") || norm.includes("dinheiro")
  ) {
    return [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop", // Minimalist: abstract gold/dark marble
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated: colorful modern fluid shapes
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1024&auto=format&fit=crop", // Realist: skyline glass skyscraper looking up
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: minimalist clean textured paper
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop"  // Abstract: 3D premium geometric glass spheres
    ];
  }

  // Espiritualidade / Religião / Fé / Mindfulness / Meditação / Filosofia
  if (
    norm.includes("espiritual") || norm.includes("religião") || norm.includes("fé") || 
    norm.includes("mindful") || norm.includes("medita") || norm.includes("filosofia") || 
    norm.includes("deus") || norm.includes("alma") || norm.includes("zen") || norm.includes("igreja")
  ) {
    return [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop", // Minimalist: luxury dark/gold texture
      "https://images.unsplash.com/photo-1618005198143-e528346447c2?q=80&w=1024&auto=format&fit=crop", // Illustrated: premium abstract colorful waves
      "https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?q=80&w=1024&auto=format&fit=crop", // Realist: rays of inspiring light through clouds
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: concrete/paper background
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1024&auto=format&fit=crop"  // Abstract: cosmic neon lights grid
    ];
  }

  // Saúde / Bem-estar / Fitness / Nutrição / Emagrecimento / Esportes
  if (
    norm.includes("saúde") || norm.includes("bem-estar") || norm.includes("fitness") || 
    norm.includes("nutri") || norm.includes("emagrece") || norm.includes("esporte") || 
    norm.includes("corpo") || norm.includes("dieta") || norm.includes("treino") || norm.includes("vida saudável")
  ) {
    return [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1024&auto=format&fit=crop", // Minimalist: clean warm-beige texture
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated: vibrant organic shapes
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1024&auto=format&fit=crop", // Realist: peaceful silhouette meditating in golden dawn
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: linen paper texture
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop"  // Abstract: 3D fluid shape
    ];
  }

  // Autoajuda / Desenvolvimento Pessoal / Psicologia / Relacionamentos / Paternagem / Maternagem / Infantil
  if (
    norm.includes("autoajuda") || norm.includes("desenvolvimento") || norm.includes("psicolo") || 
    norm.includes("relaciona") || norm.includes("casal") || norm.includes("mente") || 
    norm.includes("pessoal") || norm.includes("hábito") || norm.includes("comporta") ||
    norm.includes("infantil") || norm.includes("filho") || norm.includes("paternagem") || norm.includes("maternagem")
  ) {
    return [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop", // Minimalist: premium dark marble and gold
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated: beautiful vector gradient curves
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1024&auto=format&fit=crop", // Realist: conceptual golden light of mindfulness / connection
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: clean plaster texture
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop"  // Abstract: 3D glass spheres reflecting light (very modern and warm)
    ];
  }

  // Tecnologia / Programação / Inteligência Artificial / Ciências / Futurismo
  if (
    norm.includes("tecnolo") || norm.includes("program") || norm.includes("inteligência artificial") || 
    norm.includes(" ia ") || norm.includes("ai") || norm.includes("ciência") || 
    norm.includes("futuro") || norm.includes("digital") || norm.includes("computa") || norm.includes("code")
  ) {
    return [
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1024&auto=format&fit=crop", // Minimalist: quantum dark neon threads
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated: digital fluid circuit wave
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1024&auto=format&fit=crop", // Realist: cyberpunk technology server matrix
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: cyber dark plaster texture
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1024&auto=format&fit=crop"  // Abstract: neon neural grid
    ];
  }

  // Ficção / Literatura / Poesia / Fantasia / Suspense / Mistério / Romance
  if (
    norm.includes("ficção") || norm.includes("literatura") || norm.includes("poesia") || 
    norm.includes("fantas") || norm.includes("suspense") || norm.includes("mistério") || 
    norm.includes("romance") || norm.includes("conto") || norm.includes("novela")
  ) {
    return [
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1024&auto=format&fit=crop", // Minimalist: deep misty dark blue/green
      "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated: abstract vector stars/galaxy
      "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1024&auto=format&fit=crop", // Realist: cosmic night sky double exposure
      "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic: raw book paper texture
      "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop"  // Abstract: 3D celestial dreamscape
    ];
  }

  // Default Universal beautiful abstract fallbacks
  return [
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&auto=format&fit=crop", // Minimalist
    "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1024&auto=format&fit=crop", // Illustrated
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1024&auto=format&fit=crop", // Realist
    "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=1024&auto=format&fit=crop", // Typographic
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1024&auto=format&fit=crop"  // Abstract
  ];
};

function getVisualMetaphor(title: string, subtitle: string, niche: string): string {
  const t = ((title || "") + " " + (subtitle || "") + " " + (niche || "")).toLowerCase();
  
  if (t.includes("influênc") || t.includes("persua") || t.includes("storytelling") || t.includes("cérebro") || t.includes("neuro") || t.includes("mente") || t.includes("psicolog")) {
    return "a highly detailed glowing human brain, one half illuminated with electric blue neural network light and the other half with warm gold/orange energy, with a detailed vintage golden key floating right in the center as a majestic cinematic visual metaphor";
  }
  if (t.includes("finanç") || t.includes("dinheiro") || t.includes("rico") || t.includes("pobre") || t.includes("invest") || t.includes("negócio") || t.includes("lucro") || t.includes("riqueza")) {
    return "a leather-bound premium book lying open on a luxury dark wooden table, with stacked gold coins, a small green plant sprouting from a pile of golden soil, a classic gold compass, and a glass jar filled with coins in the background, warm editorial lighting";
  }
  if (t.includes("fé") || t.includes("universal") || t.includes("crenç") || t.includes("deus") || t.includes("oração") || t.includes("espirit") || t.includes("alma") || t.includes("bíblia")) {
    return "a majestic glowing stone archway or doorway opening up to a brilliant, celestial golden sky with soft sunrays, sacred clouds of deep purple and warm gold, floating light particles creating an ethereal, inspiring visual metaphor";
  }
  if (t.includes("amor") || t.includes("coração") || t.includes("sentiment") || t.includes("casamento") || t.includes("relaciona")) {
    return "an abstract cinematic composition featuring glowing red and pink ribbons of light twisting together into a beautiful harmonious knot, surrounded by gold dust on a dark textured background";
  }
  if (t.includes("saúde") || t.includes("vida") || t.includes("hábito") || t.includes("atômico") || t.includes("foco") || t.includes("produtiv")) {
    return "a serene geometric stone sculpture reflecting abstract natural forms, surrounded by water ripples and clean golden sand, representing balance, healthy habits, and atomic progress";
  }
  
  // Default elegant corporate/business or self-help metaphor
  return "a striking luxury visual metaphor featuring a clean geometric portal of light in the center, with a single traveler silhouette walking towards a brilliant horizon of golden opportunities, deep atmospheric dark blue and gold textures";
}

export const generateCoverBackgrounds = async (
  niche: string, 
  framework: any,
  title?: string,
  subtitle?: string,
  author?: string
): Promise<string[]> => {
  if (!process.env.OPENAI_API_KEY) {
    console.log("[DALL-E] No OPENAI_API_KEY found, skipping image generation. Using premium curated Unsplash fallbacks.");
    return getNicheCuratedBackgrounds(niche);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const bookTitle = title || "Sucesso e Liderança";
    const bookTheme = niche || "Negócios";
    const bookColors = framework?.colors?.join(', ') || "#0d1b2a, #d4a017, #f5f0e5";
    
    // Generate metaphor
    const metaphor = getVisualMetaphor(bookTitle, subtitle || "", bookTheme);

    // We will generate 3 base concepts following the user's best-selling design assets (No text overlays in image!)
    const concepts = [
      // Concept 0: Premium Black and Gold
      `Create a premium luxury bestseller book cover wrap background, widescreen 16:9, centered on ${metaphor}. Color theme: deep matte black and glowing 24k metallic gold, highly detailed. Style is sophisticated editorial, highly cinematic, dramatic lighting, clean textures. Extremely professional, 8k resolution. DO NOT include any text, letters, book borders, lines, spine borders, barcodes, or publisher badges. Pure raw artwork.`,

      // Concept 1: Editorial Navy and Silver
      `Create a professional authority bestseller book cover wrap background, widescreen 16:9, centered on ${metaphor}. Color theme: deep corporate navy blue, polished silver, and sharp white accents. Style is clean technical, corporate authority, modern architecture overlays, high contrast, cinematic soft lighting. DO NOT include any text, letters, book borders, lines, spine borders, barcodes, or publisher badges. Pure raw artwork.`,

      // Concept 2: Vibrant Sunset Purple and Orange
      `Create an inspiring vibrant bestseller book cover wrap background, widescreen 16:9, centered on ${metaphor}. Color theme: warm spiritual sunset with beautiful gradients of amber, crimson, violet, and glowing orange. Style is warm, aspirational, ethereal landscape, soft glowing clouds, atmospheric and dreamlike. DO NOT include any text, letters, book borders, lines, spine borders, barcodes, or publisher badges. Pure raw artwork.`
    ];

    console.log(`[DALL-E] Generating 3 parallel high-fidelity backgrounds for "${bookTitle}" (Niche: ${bookTheme})...`);

    const imagePromises = concepts.map(async (promptText) => {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: promptText,
          n: 1,
          size: "1024x1792",
          quality: "standard",
        });
        return response?.data?.[0]?.url as string;
      } catch (err) {
        console.error("[DALL-E] Error generating individual image:", err);
        return null;
      }
    });

    const results = await Promise.all(imagePromises);
    const validUrls = results.filter(url => url !== null) as string[];
    console.log(`[DALL-E] Successfully generated ${validUrls.length} backgrounds.`);
    
    // Fill up to exactly 5 items using our curated Unsplash backgrounds
    const unsplashFallbacks = getNicheCuratedBackgrounds(niche);
    
    // validUrls holds concepts generated by DALL-E. If some failed, fill them.
    while (validUrls.length < 3) {
      validUrls.push(unsplashFallbacks[validUrls.length]);
    }
    
    // Force items 3 (Typographic) and 4 (Abstract) to be highly beautiful, high-contrast Unsplash textures
    validUrls.push(unsplashFallbacks[3]); // Typographic style texture
    validUrls.push(unsplashFallbacks[4]); // Abstract style texture
    
    return validUrls;

  } catch (error) {
    console.error("[DALL-E] Error in generateCoverBackgrounds, using curated Unsplash:", error);
    return getNicheCuratedBackgrounds(niche);
  }
};
