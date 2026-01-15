import { BookMetadata, Chapter, MarketingAssets, TitleOption } from "../types";
import { getLLMProvider } from "./llm.factory";

const getLangName = (code: string = 'pt') => {
  const map: Record<string, string> = {
    'pt': 'Portuguese (Brazil)',
    'en': 'English (US)',
    'es': 'Spanish (Latin America)'
  };
  return map[code] || 'Portuguese (Brazil)';
};

// Granular Research Functions
export const researchYoutube = async (topic: string, lang: string = 'pt'): Promise<string> => {
  const llm = getLLMProvider();
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
  return await llm.generateText(prompt);
};

export const researchGoogle = async (topic: string, priorContext: string, lang: string = 'pt'): Promise<string> => {
  const llm = getLLMProvider();
  const langName = getLangName(lang);
  const prompt = `
      Context: ${priorContext}
      Search Google for "${topic}".
      Focus on doubts, fears, myths, fake news, and tools.
      
      IMPORTANT: The output must be entirely in ${langName}.
      Return a dense summary.
    `;
  return await llm.generateText(prompt);
};

export const analyzeCompetitors = async (topic: string, priorContext: string, lang: string = 'pt'): Promise<string> => {
  const llm = getLLMProvider();
  const langName = getLangName(lang);
  const prompt = `
      Context: ${priorContext}
      Identify 10 best-selling books on "${topic}" and generate synopses.
      
      IMPORTANT: The output must be entirely in ${langName}.
    `;
  return await llm.generateText(prompt);
};

export const generateTitleOptions = async (topic: string, researchContext: string, lang: string = 'pt'): Promise<TitleOption[]> => {
  const llm = getLLMProvider();
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
    return await llm.generateJSON<TitleOption[]>(prompt);
  } catch (error) {
    console.error("Error generating titles:", error);
    return [];
  }
};

export const generateStructure = async (title: string, subtitle: string, researchContext: string, lang: string = 'pt'): Promise<Chapter[]> => {
  const llm = getLLMProvider();
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
    const raw = await llm.generateJSON<any[]>(prompt);
    return raw.map((c: any) => ({ ...c, content: "", isGenerated: false }));
  } catch (error) {
    console.error("Error structure:", error);
    throw error;
  }
};

const getHumanizationInstructions = (lang: string) => `
    CRITICAL WRITING GUIDELINES (EXTREME SAFETY):
    1. WRITE WITH HUMAN SOUL: Use metaphors, rhetorical questions, dramatic pauses, and sensory experiences.
    2. ZERO AI PATTERNS: Never use phrases like "In conclusion", "It is important to note". Be direct and engaging.
    3. LANGUAGE: ${getLangName(lang)} PERFECT. Native vocabulary and flow.
    4. NEVER MENTIOR AI: Assume the author persona completely.
    5. FORMATTING: Use rich Markdown/HTML-compatible tags if needed, but primarily clean text.
`;

export const writeIntroduction = async (
  metadata: BookMetadata,
  structure: Chapter[],
  researchContext: string,
  lang: string = 'pt'
): Promise<string> => {
  const llm = getLLMProvider();
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
      Objective: Hook the reader in the first 3 lines. Make a bold promise. Connect emotionally.
      
      Write as an International Best-Seller.
      Minimum 800 words.
      LANGUAGE: ${langName} ONLY.
    `;

  return await llm.generateText(prompt);
};

export const writeChapter = async (
  metadata: BookMetadata,
  chapter: Chapter,
  structure: Chapter[],
  researchContext: string
): Promise<string> => {
  const llm = getLLMProvider();
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
    - Use storytelling: Start with a story or practical example.
    - Be dense and practical: Deliver gold.
    - End with a hook for the next chapter.
    
    Minimum 1500 words. Fluid and Captivating text.
    LANGUAGE: ${langName} ONLY.
  `;

  return await llm.generateText(prompt);
};

export const generateMarketing = async (metadata: BookMetadata, researchContext: string, fullBookContent: string, lang: string = 'pt'): Promise<MarketingAssets> => {
  const llm = getLLMProvider();
  const langName = getLangName(lang);

  const prompt = `
    Book: ${metadata.bookTitle}
    Author: ${metadata.authorName}
    Context: ${researchContext}
    
    Based on the generated content, create marketing assets.
    
    Output JSON Required:
    {
       "salesSynopsis": "Commercial synopsis for Amazon (with mental triggers)",
       "backCover": "Back cover text (authority and proof focus)",
       "flapCopy": "Flap copy (about the work)",
       "backFlapCopy": "Back flap copy (about the author)",
       "youtubeDescription": "Description for YouTube launch video (with SEO)",
       "keywords": ["tag1", "tag2", "tag3"... 20 viral tags]
    }
    IMPORTANT: ALL TEXT MUST BE IN ${langName}.
    Return ONLY JSON.
  `;

  return await llm.generateJSON<MarketingAssets>(prompt);
};
