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
    const llm = (0, llm_factory_1.getLLMProvider)();
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
    const llm = (0, llm_factory_1.getLLMProvider)();
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
    const llm = (0, llm_factory_1.getLLMProvider)();
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
    const llm = (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Context: ${researchContext}
    Generate 10 title and subtitle suggestions for a book about "${topic}".
    
    Criteria:
    - Must be highly commercial and viral.
    - Identify the 3 best ones (highest sales potential) by marking "isTopChoice": true.
    
    IMPORTANT: All titles and reasoning must be in ${langName}.
    
    Return JSON array: [{ "title": "...", "subtitle": "...", "reason": "...", "isTopChoice": boolean }]
    Return ONLY JSON.
  `;
    try {
        return yield llm.generateJSON(prompt);
    }
    catch (error) {
        console.error("Error generating titles:", error);
        return [];
    }
});
exports.generateTitleOptions = generateTitleOptions;
const generateStructure = (title_1, subtitle_1, researchContext_1, ...args_1) => __awaiter(void 0, [title_1, subtitle_1, researchContext_1, ...args_1], void 0, function* (title, subtitle, researchContext, lang = 'pt') {
    const llm = (0, llm_factory_1.getLLMProvider)();
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
    const llm = (0, llm_factory_1.getLLMProvider)();
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
      - Length: Minimum 2500 words.
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
    const llm = (0, llm_factory_1.getLLMProvider)();
    const lang = metadata.language || 'pt';
    const langName = getLangName(lang);
    const prompt = `
    ${getHumanizationInstructions(lang)}
    
    Author: ${metadata.authorName}
    Book: ${metadata.bookTitle}
    
    Research Context (Facts/Data): ${researchContext}
    
    CURRENT CHAPTER: ${chapter.id}. ${chapter.title}
    Chapter Promise: ${chapter.intro}
    
    TASK: Write the full content for this chapter.
    
    CRITICAL REQUIREMENT: This book MUST be comprehensive (approx 170+ pages total).
    
    Requirements:
    - **Length**: Target approx 2800 WORDS per chapter. (This is optimized for a 200-page book with large font).
    - **Depth**: Do NOT summarize. EXPAND on every concept with clear examples.
    - **Storytelling**: Begin with a detailed narrative/case study.
    - **Structure**: Use subheadings to break up the long text.
    - **Paragraphs**: EXTREMELY IMPORTANT: USE SHORT PARAGRAPHS (max 3-4 lines). NEVER create large blocks of text.
    - **Ending**: End with a cliffhanger or a powerful thought.
    - **Artifacts**: ABSOLUTELY NO "___" or "---".
    
    LANGUAGE: ${langName} ONLY.
  `;
    const raw = yield llm.generateText(prompt);
    return cleanText(raw);
});
exports.writeChapter = writeChapter;
const generateMarketing = (metadata_1, researchContext_1, fullBookContent_1, ...args_1) => __awaiter(void 0, [metadata_1, researchContext_1, fullBookContent_1, ...args_1], void 0, function* (metadata, researchContext, fullBookContent, lang = 'pt') {
    const llm = (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Book: ${metadata.bookTitle}
    Author: ${metadata.authorName}
    Subtitle: ${metadata.subTitle || "A definitive guide"}
    Context: ${researchContext}

    Based on the book content and metadata, create PROFESSIONAL MARKETING ASSETS following strict formatting.
    
    CRITICAL FORMATTING INSTRUCTIONS:
    - You must STRICTLY allow for line breaks using "\\n" in the JSON strings for proper formatting.
    - Use relevant EMOJIS where appropriate.
    - The tone must be "High-Ticket Sales", persuasive, and authoritative.
    
    TASK 1: YouTube Video Description (MUST be Detailed)
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
    • Cap 01: [Title]
    • Cap 02: [Title]
    ... (List main chapters)
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
    
    TASK 4: Back Flap Text (Orelha da Capa - Sobre o Autor)
    Format:
    [Author Name] is... [Professional Bio focusing on authority and mission - approx 100 words]

    Output JSON Required:
    {
       "youtubeDescription": "Full text with \\n...",
       "backCover": "Full text...",
       "flapCopy": "Front flap text...",
       "backFlapCopy": "Back flap text...",
       "description": "Short Amazon Synopsis (Standard)",
       "keywords": ["tag1", "tag2"...]
    }
    
    IMPORTANT: ALL TEXT MUST BE IN ${langName}.
    Return ONLY JSON.
  `;
    return yield llm.generateJSON(prompt);
});
exports.generateMarketing = generateMarketing;
const generateExtras = (metadata_1, dedicationTo_1, ackTo_1, ...args_1) => __awaiter(void 0, [metadata_1, dedicationTo_1, ackTo_1, ...args_1], void 0, function* (metadata, dedicationTo, ackTo, aboutAuthorContext = "", lang = 'pt') {
    const llm = (0, llm_factory_1.getLLMProvider)();
    const langName = getLangName(lang);
    const prompt = `
    Author: ${metadata.authorName}
    Book: ${metadata.bookTitle}

    TASK 1: Write a DEDICATION for this book.
    Target: ${dedicationTo || "Family and Friends"}
    Style: Emotional, profound, but concise (approx 50 words). NOT ITALIC. Plain text.

    TASK 2: Write ACKNOWLEDGMENTS for this book.
    Target: ${ackTo || "Everyone who helped"}
    Style: Gratitude, standard book format, generic but warm (approx 100 words). NOT ITALIC. Plain text.

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
    const llm = (0, llm_factory_1.getLLMProvider)();
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
