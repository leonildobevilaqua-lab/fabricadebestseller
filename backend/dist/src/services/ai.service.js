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
const getLangName = (code = 'pt') => {
    const map = {
        'pt': 'Portuguese (Brazil)',
        'en': 'English (US)',
        'es': 'Spanish (Latin America)'
    };
    return map[code] || 'Portuguese (Brazil)';
};
// Granular Research Functions
const researchYoutube = (topic_1, ...args_1) => __awaiter(void 0, [topic_1, ...args_1], void 0, function* (topic, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Act as a multidisciplinary content specialist.
    Perform detailed research on YouTube for the niche: "${topic}".
    Identify:
    1. Doubts, fears, and myths.
    2. Knowledge gaps.
    3. Search for solutions.
    
    IMPORTANT: The output must be entirely in ${langName}.
    Return a structured summary.
  `;
    return yield llm.generateText(prompt);
});
exports.researchYoutube = researchYoutube;
const researchGoogle = (topic_1, priorContext_1, ...args_1) => __awaiter(void 0, [topic_1, priorContext_1, ...args_1], void 0, function* (topic, priorContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
      Context: ${priorContext}
      Search Google for "${topic}".
      Focus on doubts, fears, myths, fake news, and tools.
      
      IMPORTANT: The output must be entirely in ${langName}.
      Return a dense summary.
    `;
    return yield llm.generateText(prompt);
});
exports.researchGoogle = researchGoogle;
const analyzeCompetitors = (topic_1, priorContext_1, ...args_1) => __awaiter(void 0, [topic_1, priorContext_1, ...args_1], void 0, function* (topic, priorContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
      Context: ${priorContext}
      Identify 10 best-selling books on "${topic}" and generate synopses.
      
      IMPORTANT: The output must be entirely in ${langName}.
    `;
    return yield llm.generateText(prompt);
});
exports.analyzeCompetitors = analyzeCompetitors;
const generateTitleOptions = (topic_1, researchContext_1, ...args_1) => __awaiter(void 0, [topic_1, researchContext_1, ...args_1], void 0, function* (topic, researchContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    // Sanitize topic to avoid breaking prompt with quotes
    const safeTopic = topic.replace(/"/g, "'").trim();
    const prompt = `
    Context: ${researchContext.substring(0, 2000)}...
    
    Task: Create 10 VIRAL book title suggestions for this specific topic: "${safeTopic}".
    
    CRITICAL RULES FOR TITLES:
    1. MAX 8 WORDS per title. Short, Punchy, Aggressive.
    2. MUST BE PERSUASIVE. Use triggers like "Secrets", "Mastering", "The Truth", "Definitive Guide".
    3. SUBTITLES should explain the specific benefit/transformation.
    4. VARIETY: Mix "How-to", "Counter-intuitive", "Listicle", and "Promise-based" titles.
    
    LANGUAGE: All content must be in ${langName} and sound natural/native.

    Return JSON array: 
    [
      { "title": "Short Title", "subtitle": "Compelling Subtitle", "reason": "Why this sells", "isTopChoice": boolean, "marketingHook": "Marketing phrase", "score": number }
    ]
    
    Return ONLY JSON.
  `;
    try {
        const titles = yield llm.generateJSON(prompt);
        if (!titles || !Array.isArray(titles) || titles.length === 0) {
            throw new Error("Invalid or empty titles generated");
        }
        // Ensure we have at least 10 (or return what we have)
        return titles;
    }
    catch (error) {
        console.error("Error generating titles, using fallback:", error);
        // Fallback: Create a short label from topic (First 5 words) to avoid huge titles
        const shortTopicLabel = safeTopic.split(' ').slice(0, 6).join(' ') + (safeTopic.split(' ').length > 6 ? '...' : '');
        return [
            {
                title: `A Bíblia de ${shortTopicLabel}`,
                subtitle: "O manual definitivo que os especialistas não querem que você leia",
                reason: "Autoridade absoluta e curiosidade (Fallback)",
                isTopChoice: true,
                marketingHook: "O segredo final.",
                score: 98
            },
            {
                title: `Domine ${shortTopicLabel}`,
                subtitle: "O passo a passo prático, do zero ao avançado em tempo recorde",
                reason: "Promessa de rapidez e eficácia (Fallback)",
                isTopChoice: true,
                marketingHook: "Resultados rápidos.",
                score: 95
            },
            {
                title: `Os Segredos de ${shortTopicLabel}`,
                subtitle: "O que ninguém te contou sobre como ter sucesso real",
                reason: "Gatilho de prova social e segredo (Fallback)",
                isTopChoice: true,
                marketingHook: "A verdade revelada.",
                score: 92
            },
            {
                title: `${shortTopicLabel} Sem Filtro`,
                subtitle: "A verdade nua e crua sobre o que realmente funciona",
                reason: "Honestidade radical (Fallback)",
                isTopChoice: false,
                marketingHook: "Direto ao ponto.",
                score: 89
            },
            {
                title: `Descomplicando ${shortTopicLabel}`,
                subtitle: "Guia prático e direto para quem não tem tempo a perder",
                reason: "Simplicidade e facilidade (Fallback)",
                isTopChoice: false,
                marketingHook: "Sem enrolação.",
                score: 88
            },
            {
                title: `Mestres de ${shortTopicLabel}`,
                subtitle: "As estratégias ocultas dos maiores experts do mercado",
                reason: "Modelagem de sucesso (Fallback)",
                isTopChoice: false,
                marketingHook: "Aprenda com os melhores.",
                score: 85
            },
            {
                title: `O Fim de ${shortTopicLabel}`,
                subtitle: "Por que tudo o que você sabe está errado (e o jeito novo de fazer)",
                reason: "Controvérsia e quebra de padrão (Fallback)",
                isTopChoice: false,
                marketingHook: "Revolucionário.",
                score: 84
            },
            {
                title: `Hackeando ${shortTopicLabel}`,
                subtitle: "Atalhos inteligentes para resultados acima da média",
                reason: "Desejo de atalho/esperteza (Fallback)",
                isTopChoice: false,
                marketingHook: "Vantagem injusta.",
                score: 82
            },
            {
                title: `O Código de ${shortTopicLabel}`,
                subtitle: "Desvendando o sistema para garantir sua aprovação/sucesso",
                reason: "Mistério e sistema (Fallback)",
                isTopChoice: false,
                marketingHook: "Decifre o código.",
                score: 80
            },
            {
                title: `Tudo Sobre ${shortTopicLabel}`,
                subtitle: "O guia essencial de consulta rápida e prática",
                reason: "Utilidade e segurança (Fallback)",
                isTopChoice: false,
                marketingHook: "Tenha sempre à mão.",
                score: 75
            }
        ];
    }
});
exports.generateTitleOptions = generateTitleOptions;
const generateStructure = (title_1, subtitle_1, researchContext_1, ...args_1) => __awaiter(void 0, [title_1, subtitle_1, researchContext_1, ...args_1], void 0, function* (title, subtitle, researchContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Context: ${researchContext}
    Book: ${title} - ${subtitle}
    Create a 12-chapter structure.
    
    IMPORTANT: Review content context and ensure chapters flow logically.
    IMPORTANT: ALL CONTENT MUST BE IN ${langName}.
    
    Return JSON: [{ "id": 1, "title": "...", "intro": "..." }]
    Return ONLY JSON.
  `;
    try {
        const raw = yield llm.generateJSON(prompt);
        return raw.map((c) => (Object.assign(Object.assign({}, c), { content: "", isGenerated: false })));
    }
    catch (error) {
        console.error("Error structure:", error);
        throw error;
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
const getHumanizationInstructions = (lang) => `
    CRITICAL WRITING GUIDELINES (ANTI-AI STRICT MODE):
    1. **HUMAN SOUL**: Write with imperfection, nuance, and emotion. Use rhetorical questions, vivid metaphors, and sensory details.
    2. **STRICTLY FORBIDDEN**: 
       - NO "In conclusion", "It is important to note", "In summary", or "Ultimately".
       - NO separators like "___", "---", "***", "###".
       - NO placeholders like "[Insert text]".
       - NO robotic lists or bullet points unless absolutely necessary for the format.
    3. **FORMATTING**: Return CLEAN PARAGRAPHS. Do not use Markdown headers (#) inside the text. Use natural transitions between ideas instead of headers.
    4. **LANGUAGE**: ${getLangName(lang)} (Native & Natural). Do NOT use literal translations or stiff formal language. Use contractions and colloquialisms where appropriate for the genre.
    5. **SHOW, DON'T TELL**: Don't say "it was exciting", describe the heart racing.
`;
const writeIntroduction = (metadata_1, structure_1, researchContext_1, ...args_1) => __awaiter(void 0, [metadata_1, structure_1, researchContext_1, ...args_1], void 0, function* (metadata, structure, researchContext, lang = 'pt') {
    const llm = yield (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const structureList = structure.map(c => `- ${c.title}`).join('\n');
    const prompt = `
      ${getHumanizationInstructions(lang)}
      
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
      - Length: Minimum 2000 words. (CRITICAL: EXPAND EVERY POINT)
      - Tone: Best-seller authority, confident, yet intimate.
      - Flow: Continuous, absorbing text. NO section headers within the introduction.
      - Content: Tell a powerful, long, and detailed personal story or case study that illustrates the problem. Dive deep into the pain points.
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
    Context: ${researchContext}
    Book: ${metadata.bookTitle}
    Chapter: ${chapter.title}
    Chapter Objective: ${chapter.intro}

    TASK: Create a detailed outline for this chapter with exactly 5 distinct sub-sections.
    Each sub-section must cover a specific aspect of the chapter's topic in depth.
    
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
        subtopics = ["Fundamentos", "Estratégias Avançadas", "Erros Comuns", "Estudos de Caso", "Plano de Ação"];
    }
    // Ensure we don't go overboard if AI hallucinates 10 topics
    subtopics = subtopics.slice(0, 6);
    // 2. Iterative Generation
    let fullChapterContent = "";
    // 2.1 Intro of Chapter
    try {
        const introPrompt = `
        ${getHumanizationInstructions(lang)}
        Context: ${researchContext}
        Chapter: ${chapter.title}
        Objective: ${chapter.intro}
        
        TASK: Write the INTRODUCTION for this chapter (approx 400 words).
        Hook the reader, explain what will be covered, and set the stage.
        Start directly with the content.
        LANGUAGE: ${langName}.
    `;
        fullChapterContent += (yield llm.generateText(introPrompt)) + "\n\n";
        // 2.2 Sections
        for (const subtopic of subtopics) {
            const sectionPrompt = `
            ${getHumanizationInstructions(lang)}
            Book: ${metadata.bookTitle}
            Chapter: ${chapter.title}
            
            Current Section: "${subtopic}"
            
            TASK: Write a detailed section for this specific topic (approx 500 words).
            Include detailed examples, actionable advice, and deep analysis.
            Do NOT repeat the introduction. Dive deep.
            
            Previous Context:
            ${fullChapterContent.slice(-500)}
            
            LANGUAGE: ${langName}.
        `;
            const content = yield llm.generateText(sectionPrompt);
            fullChapterContent += `### ${subtopic}\n\n${content}\n\n`;
        }
        // 2.3 Conclusion
        const conclusionPrompt = `
        ${getHumanizationInstructions(lang)}
        Chapter: ${chapter.title}
        
        TASK: Write a powerful CONCLUSION for this chapter (approx 300 words).
        Summarize key points and transition to the next idea.
        
        LANGUAGE: ${langName}.
    `;
        fullChapterContent += (yield llm.generateText(conclusionPrompt));
    }
    catch (error) {
        console.error("Error in iterative writing, falling back to single shot", error);
        // Fallback to single shot if iteration fails completely
        const prompt = `
        ${getHumanizationInstructions(lang)}
        Author: ${metadata.authorName}
        Book: ${metadata.bookTitle}
        Research Context: ${researchContext}
        CURRENT CHAPTER: ${chapter.id}. ${chapter.title}
        TASK: Write the full content for this chapter. length: 3000 words.
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
    return yield llm.generateJSON(prompt);
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
