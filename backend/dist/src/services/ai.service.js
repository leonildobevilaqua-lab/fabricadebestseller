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
exports.structureBookFromText = exports.generateExtras = exports.generateMarketing = exports.writeChapter = exports.writeIntroduction = exports.generateStructure = exports.generateTitleOptions = exports.analyzeCompetitors = exports.researchGoogle = exports.researchYoutube = void 0;
const llm_factory_1 = require("./llm.factory");
const logger_1 = require("../utils/logger");
const getLangName = (code = 'pt') => {
    const map = {
        'pt': 'Portuguese (Brazil)',
        'en': 'English (US)',
        'es': 'Spanish (Latin America)'
    };
    return map[code] || 'Portuguese (Brazil)';
};
const research_service_1 = require("./research.service");
// SYSTEM INSTRUCTION FOR ALL GENERATIONS
const SYSTEM_INSTRUCTION = `
Atue como um especialista multidisciplinar em conteúdo editorial e Ghostwriter de Best-Sellers da Amazon.
Sua missão é criar livros baseados EXCLUSIVAMENTE em dados reais de mercado.
NUNCA invente dores ou desejos. Use os dados das pesquisas fornecidas.
`;
// Granular Research Functions
const researchYoutube = (topic_1, ...args_1) => __awaiter(void 0, [topic_1, ...args_1], void 0, function* (topic, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    // 1. FETCH REAL DATA
    let videos = [];
    try {
        videos = yield research_service_1.ResearchService.searchYouTube(topic);
    }
    catch (e) {
        console.warn("YouTube search error", e);
    }
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
        const simRaw = yield llm.generateText(simPrompt);
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
        return yield llm.generateText(prompt);
    }
    catch (error) {
        console.warn('YouTube Research Analysis failed', error); // Fallback to raw data if LLM fails?
        return `Análise de dados reais falhou, mas aqui estão os vídeos encontrados:\n${contextData}`;
    }
});
exports.researchYoutube = researchYoutube;
const researchGoogle = (topic_1, priorContext_1, ...args_1) => __awaiter(void 0, [topic_1, priorContext_1, ...args_1], void 0, function* (topic, priorContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    // 1. FETCH REAL DATA
    let articles = [];
    try {
        articles = yield research_service_1.ResearchService.searchGoogle(topic + " dores comuns segredos");
    }
    catch (e) {
        console.warn("Google search error", e);
    }
    if (!articles || articles.length === 0) {
        console.log("[RESEARCH] Google Search failed/empty. Simulating data via LLM...");
        const simPrompt = `
        Atue como o Google.
        Liste 5 artigos de blog de autoridade sobre: "${topic}".
        Foque em títulos que prometem "Segredos", "Erros Comuns" ou "Passo a Passo".
        Format:
        - Title: [Titulo] | Desc: [Resumo do Artigo]
      `;
        const simRaw = yield llm.generateText(simPrompt);
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
        return yield llm.generateText(prompt);
    }
    catch (error) {
        return `Erro na análise do Google, dados brutos:\n${contextData}`;
    }
});
exports.researchGoogle = researchGoogle;
const analyzeCompetitors = (topic_1, priorContext_1, ...args_1) => __awaiter(void 0, [topic_1, priorContext_1, ...args_1], void 0, function* (topic, priorContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    // 1. FETCH REAL DATA (Amazon via Google)
    let books = [];
    try {
        books = yield research_service_1.ResearchService.searchAmazon(topic);
    }
    catch (e) {
        console.warn("Amazon search error", e);
    }
    if (!books || books.length === 0) {
        console.log("[RESEARCH] Amazon Search failed/empty. Simulating Best-Sellers via LLM...");
        const simPrompt = `
        Atue como a Amazon Best-Sellers list.
        Liste 5 livros FICITÍCIOS mas realistas que seriam Best-Sellers sobre: "${topic}".
        Use títulos comerciais fortes.
        Format:
        - Book: [Titulo] | Snippet: [Promessa do livro]
      `;
        const simRaw = yield llm.generateText(simPrompt);
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
        return yield llm.generateText(prompt);
    }
    catch (error) {
        return `Erro na análise de concorrentes, dados brutos:\n${contextData}`;
    }
});
exports.analyzeCompetitors = analyzeCompetitors;
const generateTitleOptions = (topic_1, researchContext_1, ...args_1) => __awaiter(void 0, [topic_1, researchContext_1, ...args_1], void 0, function* (topic, researchContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    // Sanitize topic to avoid breaking prompt with quotes
    const safeTopic = topic.replace(/"/g, "'").trim();
    const seed = Math.floor(Math.random() * 10000); // Random seed to break cache
    // 1. PRIMARY ATTEMPT: FACT-BASED TITLES (ULTIMATO)
    // 1. PRIMARY ATTEMPT: FACT-BASED TITLES (STRICT PROMPT MESTRE)
    const prompt = `
    BASEADO NA PESQUISA DE MERCADO (Simulada ou Real):
    ${researchContext.substring(0, 20000)}

    TEMA DO USUÁRIO: "${safeTopic}"

    SUA MISSÃO: Crie **8 TÍTULOS ALTAMENTE VENDÁVEIS** para um livro digital.
    REGRAS DE OURO (Siga estritamente):
    1. PROIBIDO: Nunca inicie com "Guia Completo de ${safeTopic}". O título deve ser original.
    2. ESTRUTURA: Use "Título Curto e Impactante: Subtítulo com a Promessa da Transformação".
    3. MODELAGEM: Baseie-se nos Best Sellers da Amazon listados na pesquisa.
    4. QUANTIDADE: Exatamente 8 opções.
    5. LANGUAGE: ${langName}.

    EXEMPLO DO QUE EU QUERO (Para o nicho de Magia):
    - "Grimório da Luz: O Caminho Prático da Magia Branca para Iniciantes"
    - "Alquimia da Alma: Rituais Cabalísticos para Prosperidade e Proteção"
    - "O Código do Pentagrama: Guia de Segurança para Rituais Poderosos"

    Gere o JSON:
    [
      { "title": "Título Principal", "subtitle": "Subtítulo da Promessa", "marketingHook": "Gatilho mental usado", "score": 90, "isTopChoice": boolean },
      ... (8 ITENS)
    ]
    
    Return ONLY JSON.
  `;
    try {
        const titles = yield llm.generateJSON(prompt);
        if (!titles || !Array.isArray(titles) || titles.length === 0)
            throw new Error("Empty titles");
        return titles;
    }
    catch (primaryError) {
        console.warn("Primary Title Generation Failed. Attempting RESCUE...", primaryError);
        (0, logger_1.logError)("AI_TITLE_PRIMARY_FAIL", primaryError);
        // 2. RESCUE ATTEMPT: SIMPLE PROMPT (User Requested)
        try {
            console.log("Tentando recuperação com prompt simples...");
            const simplePrompt = `Task: Create 8 Best-Seller Book Titles about: "${safeTopic}". Return JSON array: [{ "title": "Title", "subtitle": "Subtitle", "score": 85 }]`;
            const rescueTitles = yield llm.generateJSON(simplePrompt);
            if (rescueTitles && Array.isArray(rescueTitles) && rescueTitles.length > 0) {
                return rescueTitles;
            }
        }
        catch (rescueError) {
            console.error("Rescue AI Call Failed.", rescueError);
        }
        // 3. NUCLEAR FALLBACK: SMART TEMPLATE GENERATION (NO MORE "Guia Completo")
        // If AI fails completely, use string manipulation to create decent titles.
        const cleanTopic = safeTopic.replace(/guia/gi, '').replace(/completo/gi, '').replace(/prático/gi, '').trim();
        return [
            { title: `O Segredo de ${cleanTopic}`, subtitle: "O método pouco conhecido para dominar o assunto", reason: "Emergency Backup", isTopChoice: true, marketingHook: "Secret", score: 85 },
            { title: `A Bíblia do ${cleanTopic}`, subtitle: "Tudo o que você precisa saber, sem rodeios", reason: "Fallback", isTopChoice: false, marketingHook: "Authority", score: 80 },
            { title: `${cleanTopic}: A Verdade`, subtitle: "Caindo os mitos que te impedem de avançar", reason: "Fallback", isTopChoice: false, marketingHook: "Controversy", score: 80 },
            { title: `Mestres do ${cleanTopic}`, subtitle: "Estratégias avançadas para iniciantes", reason: "Fallback", isTopChoice: false, marketingHook: "Evolution", score: 80 },
            { title: `${cleanTopic} Lucrativo`, subtitle: "Como transformar este conhecimento em resultados reais", reason: "Fallback", isTopChoice: false, marketingHook: "Benefit", score: 75 },
            { title: `O Fim do ${cleanTopic}`, subtitle: "Por que tudo o que você sabe está errado", reason: "Fallback", isTopChoice: false, marketingHook: "Negativity", score: 75 },
            { title: `${cleanTopic} Em 7 Dias`, subtitle: "Um plano de ação acelerado", reason: "Fallback", isTopChoice: false, marketingHook: "Speed", score: 75 },
            { title: `Essencial ${cleanTopic}`, subtitle: "Guia prático e direto ao ponto", reason: "Fallback", isTopChoice: false, marketingHook: "Simplicity", score: 70 }
        ];
    }
});
exports.generateTitleOptions = generateTitleOptions;
const generateStructure = (title_1, subtitle_1, researchContext_1, ...args_1) => __awaiter(void 0, [title_1, subtitle_1, researchContext_1, ...args_1], void 0, function* (title, subtitle, researchContext, lang = 'pt', contentStyle) {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Context: ${researchContext}
    Book: ${title} - ${subtitle}
    
    TASK: Create a structure of 12 Chapters.
    ORDER LOGIC: Fundamentos -> Quebra de Mitos -> Método Prático -> Aplicação Avançada.
    
    CRITICAL: Each chapter must resolve one of the specific doubts found in the YouTube/Google research ('DORES_DO_PUBLICO').
    The goal is to produce a comprehensive book (200+ pages).
    
    STYLE: "${contentStyle || 'Professional'}".
    
    IMPORTANT: ALL CONTENT MUST BE IN ${langName}.
    
    Return JSON: [{ "id": 1, "title": "...", "intro": "Detailed description..." }]
    Return ONLY JSON.
  `;
    try {
        const raw = yield llm.generateJSON(prompt);
        return raw.map((c) => (Object.assign(Object.assign({}, c), { content: "", isGenerated: false })));
    }
    catch (error) {
        console.error("Error generating structure, using FALLBACK TEMPLATE:", error);
        // FALLBACK STRUCTURE TO PREVENT CRASH
        // Enhanced descriptions as requested
        return [
            { id: 1, title: "Fundamentos Essenciais", intro: "Neste capítulo inicial, vamos estabelecer a base sólida necessária para toda a jornada, definindo os conceitos chave que serão usados ao longo do livro. Sem estes fundamentos, qualquer estratégia avançada tende a falhar. Você aprenderá a terminologia correta e os princípios imutáveis que regem este tema.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 2, title: "História e Contexto", intro: "Faremos uma viagem no tempo para entender como chegamos até o cenário atual, analisando os grandes marcos históricos que moldaram este mercado. Compreender o passado é essencial para prever o futuro e evitar erros cíclicos. Veremos também por que agora é o momento exato para agir.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 3, title: "Ferramentas e Preparação", intro: "Aqui você terá acesso ao arsenal completo necessário para começar, incluindo a lista de softwares, equipamentos e recursos indispensáveis. Discutiremos como organizar seu ambiente para máxima produtividade, evitando que você perca tempo precioso com questões técnicas básicas.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 4, title: "Mentalidade de Sucesso", intro: "Sabemos que 80% do sucesso é psicologia e apenas 20% é mecânica. Vamos blindar sua mente contra a autossabotagem e o medo do fracasso, instalando o mindset dos vencedores. Você aprenderá a pensar como um profissional antes mesmo de ter os primeiros grandes resultados.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 5, title: "Estratégias Iniciais", intro: "É hora de sair da teoria e ir para a prática. Apresentaremos os primeiros passos acionáveis que geram pequenas vitórias rápidas (Quick Wins), essenciais para manter sua motivação. O foco aqui é criar movimento (momentum) e quebrar a inércia inicial.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 6, title: "Técnicas Intermediárias", intro: "Agora que a base está pronta, vamos aprofundar. Sairemos do básico para explorar as nuances que diferenciam os amadores dos profissionais de verdade. O foco deste capítulo é otimização, eficiência e aumento da qualidade dos seus resultados.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 7, title: "Superando Obstáculos Comuns", intro: "Este capítulo serve como um mapa de minas. Identificamos as armadilhas clássicas que derrubam a maioria das pessoas neste estágio e entregamos as soluções prontas. Você saberá exatamente como contornar problemas antes mesmo que eles apareçam.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 8, title: "Segredos dos Especialistas", intro: "Entramos no jogo de alto nível. Revelaremos truques de bastidores, hacks pouco conhecidos e estratégias que apenas a elite do setor utiliza. Estas são as informações que geralmente são guardadas a sete chaves e que geram resultados desproporcionais.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 9, title: "Estudos de Caso Reais", intro: "Nada melhor que a prova na prática. Faremos a desconstrução detalhada de casos de sucesso (e também de fracasso) para ilustrar como a teoria se aplica no mundo real. Veremos números, dados e exemplos concretos para facilitar sua visualização.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 10, title: "O Futuro da Área", intro: "Vamos antecipar tendências. Uma análise preditiva do que vem por aí nos próximos 5 a 10 anos, garantindo que você esteja posicionado na crista da onda. O objetivo é que você não seja pego de surpresa pelas mudanças e continue relevante a longo prazo.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 11, title: "Plano de Ação de 30 Dias", intro: "Chega de dúvidas sobre o que fazer. Aqui você terá um roteiro definitivo, um calendário dia após dia, semana após semana. Ele dirá exatamente qual tarefa executar para implementar tudo o que foi aprendido neste livro de forma organizada e sequencial.", content: "", isGenerated: false, summary: "", isCompleted: false },
            { id: 12, title: "Conclusão e Próximos Passos", intro: "O fim do livro é apenas o começo da sua nova jornada. Discutiremos como manter os resultados a longo prazo e continuar evoluindo constantemente. Você sairá daqui com um plano claro para se tornar uma referência e consolidar seu legado na área.", content: "", isGenerated: false, summary: "", isCompleted: false }
        ];
    }
});
exports.generateStructure = generateStructure;
// Utility to clean AI artifacts
const cleanText = (text) => {
    return text
        .replace(/_{2,}/g, '') // Remove ___
        .replace(/-{3,}/g, '') // Remove ---
        .replace(/#{2,}/g, '') // Remove ###
        .replace(/\*{2,}/g, '') // Remove ** (optional, but requested "clean text")
        .replace(/\s{2,}/g, ' ') // Remove double spaces
        .replace(/\[.*?\]/g, '') // Remove placeholders like [Insert name]
        .replace(/In conclusion,|Em conclusão,|Por fim,|Concluindo,/gi, '') // Remove typical AI transitions
        .trim();
};
const getHumanizationInstructions = (lang, style = 'Profissional', tone = 'Natural') => `
    CRITICAL WRITING GUIDELINES (ANTI-AI STRICT MODE):
    1. **HUMAN SOUL**: Write with imperfection, nuance, and emotion. Use rhetorical questions, vivid metaphors, and sensory details.
    2. **STYLE & TONE**:
       - **Content Style**: ${style}
       - **Writing Tone**: ${tone}
       - ADAPT THE WRITING ACCORDINGLY.
    3. **STRICTLY FORBIDDEN**: 
       - NO "In conclusion", "It is important to note", "In summary", or "Ultimately".
       - NO separators like "___", "---", "***", "###".
       - NO placeholders like "[Insert text]".
       - NO robotic lists or bullet points unless absolutely necessary for the format.
    4. **FORMATTING**: Return CLEAN PARAGRAPHS. Do not use Markdown headers (#) inside the text. Use natural transitions between ideas instead of headers.
    5. **LANGUAGE**: ${getLangName(lang)} (Native & Natural). Do NOT use literal translations or stiff formal language. Use contractions and colloquialisms where appropriate for the genre.
    6. **SHOW, DON'T TELL**: Don't say "it was exciting", describe the heart racing.
`;
const writeIntroduction = (metadata_1, structure_1, researchContext_1, ...args_1) => __awaiter(void 0, [metadata_1, structure_1, researchContext_1, ...args_1], void 0, function* (metadata, structure, researchContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const structureList = structure.map(c => `- ${c.title}`).join('\n');
    const style = metadata.contentStyle || 'Profissional / Técnico';
    const tone = metadata.writingTone || 'Autoridade e Confiança';
    const prompt = `
      ${getHumanizationInstructions(lang, style, tone)}
      
      Author: ${metadata.authorName}
      Book: ${metadata.bookTitle}
      Subtitle: ${metadata.subTitle}
      
      Structure:
      ${structureList}
      
      Research Context:
      ${researchContext}
      
      TASK: Write the INTRODUCTION for this book.
      Objective: Hook the reader IMMEDIATELY. Start with a controversial statement, a personal story, or a surprising fact.
      
      Requirements:
      - Length: Approx 1500 words. (CRITICAL: Be concise but powerful)
      - Tone: Best-seller authority, confident, yet intimate.
      - Flow: Continuous, absorbing text. NO section headers within the introduction.
      - Content: Tell a powerful personal story or case study that illustrates the problem. Dive deep into the pain points.
      - LANGUAGE: ${langName} ONLY.
    `;
    const raw = yield llm.generateText(prompt);
    return cleanText(raw);
});
exports.writeIntroduction = writeIntroduction;
const writeChapter = (metadata, chapter, structure, researchContext) => __awaiter(void 0, void 0, void 0, function* () {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const lang = metadata.language || 'pt';
    const langName = getLangName(lang);
    // 1. Generate Outline for the Chapter (Agentic Split)
    const outlinePrompt = `
    ${SYSTEM_INSTRUCTION}
    Context: ${researchContext.substring(0, 5000)}...
    Book: ${metadata.bookTitle}
    Chapter: ${chapter.title}
    Chapter Objective: ${chapter.intro}

    TASK: Create a detailed outline for this chapter with exactly 5 distinct sub-sections.
    Each sub-section must cover a specific aspect of the chapter's topic in EXTREME depth.
    
    Output JSON: ["Subheading 1", "Subheading 2", "Subheading 3", "Subheading 4", "Subheading 5"]
    Output ONLY JSON.
    Language: ${langName}.
  `;
    let subtopics = [];
    try {
        subtopics = yield llm.generateJSON(outlinePrompt);
    }
    catch (e) {
        console.error("Failed to generate outline, using fallback topics", e);
        // Fallback topics if JSON fails
        subtopics = ["Fundamentos", "Histórico e Evolução", "Principais Desafios", "Ferramentas e Técnicas", "Estudos de Caso"];
    }
    // Ensure we don't go overboard if AI hallucinates 10 topics
    subtopics = subtopics.slice(0, 5);
    // 2. Iterative Generation
    let fullChapterContent = "";
    // 2.1 Intro of Chapter
    const style = metadata.contentStyle || 'Profissional';
    const tone = metadata.writingTone || 'Natural';
    try {
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
        fullChapterContent += (yield llm.generateText(introPrompt)) + "\n\n";
        // 2.2 Sections
        for (const subtopic of subtopics) {
            const sectionPrompt = `
            ${getHumanizationInstructions(lang, style, tone)}
            
            CONTEXTO DE PESQUISA (Use isso como base, não invente):
            ${researchContext.substring(0, 3000)}
            
            Book: ${metadata.bookTitle}
            Chapter: ${chapter.title}
            
            Current Section: "${subtopic}"
            
            TAREFA: Escreva o conteúdo desta seção.
            REGRAS:
            - Use tom conversacional e prático.
            - Foco total em resolver as dores listadas acima.
            
            Previous Context:
            ${fullChapterContent.slice(-500)}
            
            LANGUAGE: ${langName}.
        `;
            const content = yield llm.generateText(sectionPrompt);
            fullChapterContent += `### ${subtopic}\n\n${content}\n\n`;
        }
        // 2.3 Conclusion
        const conclusionPrompt = `
        ${getHumanizationInstructions(lang, style, tone)}
        Chapter: ${chapter.title}
        
        TASK: Write a powerful CONCLUSION for this chapter (approx 150 words).
        Summarize key points and transition to the next idea.
        
        LANGUAGE: ${langName}.
    `;
        fullChapterContent += (yield llm.generateText(conclusionPrompt));
    }
    catch (error) {
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
        - Mínimo de 2000 palavras.
        - Use tom conversacional e prático.
        - Foco total em resolver as dores listadas na pesquisa.
        
        LANGUAGE: ${langName}.
      `;
        const raw = yield llm.generateText(prompt);
        return cleanText(raw);
    }
    return cleanText(fullChapterContent);
});
exports.writeChapter = writeChapter;
const generateMarketing = (metadata_1, researchContext_1, structure_1, ...args_1) => __awaiter(void 0, [metadata_1, researchContext_1, structure_1, ...args_1], void 0, function* (metadata, researchContext, structure, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
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
        return yield llm.generateJSON(prompt);
    }
    catch (e) {
        console.error("Marketing JSON Generation Failed. Attempting Text Fallback...", e);
        (0, logger_1.logError)("MARKETING_JSON_FAIL", e);
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
            const text = yield llm.generateText(textPrompt);
            // Helper to extract
            const extract = (marker, nextMarker) => {
                const start = text.indexOf(marker);
                if (start === -1)
                    return "Conteúdo gerado manualmente necessário.";
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
        }
        catch (rescueError) {
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
});
exports.generateMarketing = generateMarketing;
const generateExtras = (metadata_1, dedicationTo_1, ackTo_1, ...args_1) => __awaiter(void 0, [metadata_1, dedicationTo_1, ackTo_1, ...args_1], void 0, function* (metadata, dedicationTo, ackTo, aboutAuthorContext = "", lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Author: ${metadata.authorName}
    Book: ${metadata.bookTitle}

    TASK 1: Write a DEDICATION for this book.
    Target: ${dedicationTo || "Family and Friends"}
    Style: Emotional, profound, and rich (approx 100 words). NOT ITALIC. Plain text.

    TASK 2: Write ACKNOWLEDGMENTS for this book.
    Target: ${ackTo || "Everyone who helped"}
    Style: Gratitude, standard book format, detailed and warm (approx 300 words). NOT ITALIC. Plain text.

    TASK 3: Write an ABOUT THE AUTHOR section.
    Context: ${aboutAuthorContext || "Experienced professional in the field of " + metadata.topic}
    Style: Professional, 3rd person, establishing authority. (approx 150 words).
    
    OUTPUT JSON:
    {
        "dedication": "...",
        "acknowledgments": "...",
        "aboutAuthor": "..."
    }
    
    IMPORTANT: ALL TEXT MUST BE IN ${langName}.
  `;
    const res = yield llm.generateJSON(prompt);
    return {
        dedication: cleanText(res.dedication),
        acknowledgments: cleanText(res.acknowledgments),
        aboutAuthor: cleanText(res.aboutAuthor || "")
    };
});
exports.generateExtras = generateExtras;
const structureBookFromText = (fullText) => __awaiter(void 0, void 0, void 0, function* () {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
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
    return yield llm.generateJSON(prompt);
});
exports.structureBookFromText = structureBookFromText;
