import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    SectionType,
    PageNumber,
    Header,
    Footer,
    AlignmentType,
    HeadingLevel,
    BorderStyle,
    NumberFormat,
    ImageRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    TabStopType,
    VerticalAlign,
    SectionVerticalAlign,
    BookmarkStart,
    BookmarkEnd,
    PageReference,
    TableOfContents,
    StyleLevel
} from 'docx';
import archiver from 'archiver';
import { BookProject, BookContent, BookMetadata } from '../types';
import * as StorageService from './storage.service';
import { Writable } from 'stream';

// Measurements for 6" x 9" (152.4mm x 228.6mm)
const TWIPS_PER_INCH = 1440;
const TWIPS_PER_CM = 567;
const PAGE_WIDTH = 6 * TWIPS_PER_INCH;
const PAGE_HEIGHT = 9 * TWIPS_PER_INCH;

// Margins (User Requested)
const MARGIN_TOP = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_BOTTOM = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_INSIDE = Math.round(1.93 * TWIPS_PER_CM);
const MARGIN_OUTSIDE = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_HEADER = Math.round(0.89 * TWIPS_PER_CM);
const MARGIN_FOOTER = Math.round(0.89 * TWIPS_PER_CM);

export const generateBookDocx = async (project: BookProject): Promise<string> => {
    console.log(`[DocService] Generating DOCX for ID: ${project.id} | Title: ${project.metadata.bookTitle}`);
    if (!project.structure) {
        console.error("[DocService] FATAL: project.structure is UNDEFINED");
        project.structure = [];
    }

    // 1. Prepare Content Object
    const introChapter = project.structure.find(c => c.id === 0 || ['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));
    const mainChapters = project.structure.filter(c => c.id !== 0 && !['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));

    mainChapters.sort((a, b) => a.id - b.id);

    const content: BookContent = {
        introduction: introChapter ? introChapter.content : "",
        chapters: mainChapters,
        conclusion: "",
        dedication: project.metadata.dedication || "",
        acknowledgments: project.metadata.acknowledgments || "",
        aboutAuthor: project.metadata.aboutAuthor || "",
        marketing: project.marketing || { text: "", viralHooks: [], description: "", keywords: [], targetAudience: "", salesSynopsis: "", youtubeDescription: "", backCover: "" } as any
    };

    // 2. Generate Buffer
    const buffer = await createDocxBuffer(project.metadata, content);

    // 3. Save File Locally
    const safeEmail = project.metadata.contact?.email?.replace(/[^a-zA-Z0-9._-]/g, '_') || `project_${project.id}`;

    // Ensure directory exists
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');
    if (!fs.existsSync(outputDir)) {
        try { fs.mkdirSync(outputDir, { recursive: true }); } catch (err) { }
    }

    const filename = `book_${safeEmail}_${project.id}.docx`;
    const outputPath = path.join(outputDir, filename);

    fs.writeFileSync(outputPath, buffer);

    console.log(`Generated DOCX at ${outputPath}`);

    // Return relative path or just filename for legacy reasons? 
    // The legacy code used to return file paths. 
    // But Controller might expect URL?
    // Let's check Controller's usage later. For "localhost", returning a path that static serve can handle is key.
    // If user accesses /downloads/file, we need to return just the filename logic or full URL.
    // Let's return the local filesystem path for now, controller can handle it.
    let finalArtifactPath = outputPath;

    // 4. Generate Extras & Zip (If Marketing exists)
    if (project.marketing) {
        try {
            const zipName = `kit_completo_${safeEmail}_${project.id}.zip`;
            const zipPath = path.join(outputDir, zipName);

            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);

            // Add Book
            archive.append(buffer, { name: project.metadata.bookTitle ? `${project.metadata.bookTitle}.docx` : 'Livro.docx' });

            // Helper to add docx string
            const addDoc = async (name: string, title: string, content: string) => {
                const b = await createSimpleDocx(title, content);
                archive.append(b, { name: name });
            };

            const m = project.marketing;
            if (m.salesSynopsis) await addDoc('Sinopse_Amazon.docx', 'Sinopse Amazon', m.salesSynopsis);
            if (m.backCover) await addDoc('Texto_Contra_Capa.docx', 'Texto da Contra Capa', m.backCover);
            if (m.flapCopy) await addDoc('Texto_Orelha_Capa.docx', 'Texto da Orelha da Capa', m.flapCopy);
            if (m.backFlapCopy) await addDoc('Texto_Orelha_Contra_Capa.docx', 'Texto da Orelha da Contra Capa', m.backFlapCopy);
            if (m.youtubeDescription) await addDoc('Youtube_Descricao.docx', 'Descrição Youtube', m.youtubeDescription);
            if (m.keywords && m.keywords.length > 0) await addDoc('Palavras_Chave.docx', 'Palavras Chave', m.keywords.join(', '));
            if (content.marketing && content.marketing.description) await addDoc('Sinopse_Padrao_Profissional_Amazon.docx', 'SINOPSE PADRÃO PROFISSIONAL AMAZON', content.marketing.description);

            // Close archive
            await archive.finalize();

            // Wait for close
            await new Promise<void>((resolve, reject) => {
                output.on('close', resolve);
                output.on('error', reject);
            });

            console.log(`Generated ZIP Package at ${zipPath}`);
            finalArtifactPath = zipPath;

        } catch (err) {
            console.error("Error zipping extras:", err);
        }
    }

    return finalArtifactPath; // Returns local ABSOLUTE path
};

const createSimpleDocx = async (title: string, content: string): Promise<Buffer> => {
    // robust split by newline pattern
    const lines = content.split(/\r?\n/);

    const children: Paragraph[] = [];

    // Add Title
    children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: true, size: 36, font: "Arial", color: "2E74B5" })],
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER
    }));

    // Process Lines
    lines.forEach(line => {
        const text = line.trim();
        if (!text) {
            // Empty line = Spacing
            children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
            return;
        }

        // Check for "___" separator (User wants literal lines sometimes, but borders are nicer in Word)
        // User example explicitly used "________________________________________"
        // Let's replace with a real border for professional look
        if (text.match(/^_{3,}/) || text.match(/^-{3,}/)) {
            children.push(new Paragraph({
                border: { bottom: { color: "CCCCCC", space: 10, style: BorderStyle.SINGLE, size: 6 } },
                spacing: { after: 240, before: 120 },
                children: []
            }));
            return;
        }

        // Check for Headers (ALL CAPS ending in ? or :) or starting with Emojis like 📘, 🔥, 🛑
        // Also check explicitly for lines starting with 'Task', 'Step' etc if we wanted, but sticking to visual cues.
        const isHeader = /^[A-ZÁÉÍÓÚÃÕÀÂÊÔÇ0-9\s\?(!)]+[:\?]$/.test(text) ||
            /^[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);

        children.push(new Paragraph({
            children: [new TextRun({
                text: text,
                size: 24,
                font: "Arial",
                bold: isHeader // Auto-bold potential headers
            })],
            spacing: {
                after: isHeader ? 120 : 240,
                line: 360 // 1.5 Line Spacing for volume and readability
            }
        }));
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });
    return Packer.toBuffer(doc);
};

const createDocxBuffer = async (metadata: BookMetadata, content: BookContent): Promise<Buffer> => {

    // Helper: Load Asset safely
    const loadAsset = (filename: string): Buffer | null => {
        try {
            // Check assets folder? Or just skip for now as we don't have frontend public folder access easily.
            // But we might have them in backend/assets?
            // User didn't specify backend assets.
            // Let's assume we skip logo/qr for now or use placeholders if we could.
            // Logic in frontend: fetch('/logo_editora.png').
            // We can't fetch localhost easily inside docker/process if not running static server for it.
            return null;
        } catch (e) {
            return null;
        }
    };

    const logoBuffer = loadAsset('logo_editora.png');
    const qrBuffer = loadAsset('qr_code.png');

    // --- Helper Functions ---

    const createHeader = (text: string) => {
        return new Header({
            children: [
                new Paragraph({
                    children: [new TextRun({ text, font: "Garamond", size: 24 })], // 12pt Header
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 160 },
                }),
            ],
        });
    };

    const createFooter = () => {
        return new Footer({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            children: [PageNumber.CURRENT],
                            font: "Garamond",
                            size: 24,
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                }),
            ],
        });
    };

    const sanitizeText = (text: string): string => {
        let clean = text || "";
        clean = clean.replace(/#{1,6}\s?/g, "");
        clean = clean.replace(/^\s*[-_*]{3,}\s*$/gm, "");
        clean = clean.replace(/\n{3,}/g, "\n\n"); // Squash excessive whitespace
        return clean;
    };

    const createTextParams = (text: string) => {
        let cleanText = sanitizeText(text);

        // Safety Net 3.0: Density-based Wall of Text Detection
        const newlineCount = (cleanText.match(/\n/g) || []).length;
        const avgCharsPerLine = cleanText.length / (newlineCount + 1);

        // If average chars per paragraph is > 300 (approx 5 lines), OR total length > 250 with 0 newlines
        if (avgCharsPerLine > 300 || (cleanText.length > 250 && newlineCount < 2)) {
            console.log(`[DocService] Wall of Text Detected! Avg: ${avgCharsPerLine}, Length: ${cleanText.length}. Splitting...`);

            // Strategy: Force split every ~2 sentences or ~350 chars to create visual breathing room
            const sentences = cleanText.match(/[^.!?\n]+[.!?\n]+["']?|[^.!?\n]+$/g) || [cleanText];
            // Regex updated to include \n as a delimiter to preserve existing (rare) breaks if any

            let newText = "";
            let buffer = "";
            let sentenceCount = 0;

            sentences.forEach((s) => {
                const trimmed = s.trim();
                if (!trimmed) return;

                buffer += trimmed + " ";
                sentenceCount++;

                // Break every 2 sentences OR if buffer > 300 chars
                // Also break immediately if the sentence itself was huge (which shouldn't happen with sentence split but safe to check)
                if (sentenceCount >= 2 || buffer.length > 300) {
                    newText += buffer.trim() + "\n\n";
                    buffer = "";
                    sentenceCount = 0;
                }
            });
            if (buffer.trim()) newText += buffer.trim();
            cleanText = newText;
        }

        // FORCE SPLIT BY SINGLE NEWLINE TO ENSURE PARAGRAPHS
        const paragraphs = cleanText.split('\n').filter(p => p.trim().length > 0);
        return paragraphs.map(p => {
            const parts = p.split(/(\*\*.*?\*\*)/g);
            const children = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new TextRun({ text: part.slice(2, -2).replace(/\*/g, ''), bold: true, font: "Garamond", size: 27 }); // 13.5pt
                }
                return new TextRun({ text: part.replace(/\*/g, ''), font: "Garamond", size: 27 }); // 13.5pt
            });

            return new Paragraph({
                children: children,
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 200, line: 360 }, // 1.5 Line Spacing
                indent: { firstLine: 708 }, // 1.25 cm
            });
        });
    };

    const createTitle = (title: string, breakPage: boolean = false, bookmarkName?: string, bookmarkId?: number) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        const textRun = new TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 });

        let pChildren: any[] = [textRun];
        if (bookmarkName && bookmarkId !== undefined) {
            pChildren = [new BookmarkStart(bookmarkName, bookmarkId), textRun, new BookmarkEnd(bookmarkId)];
        }

        return new Paragraph({
            children: pChildren,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 2400, after: 1200 },
            pageBreakBefore: breakPage
        });
    };

    const createChapterNumberTitle = (num: number, title: string, bookmarkName?: string) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        const capChildren: any[] = [new TextRun({ text: `CAPÍTULO ${num}`, bold: true, font: "Garamond", size: 48 })];

        if (bookmarkName) {
            // Fix: BookmarkStart(name: string, id: number) based on type feedback
            capChildren.unshift(new BookmarkStart(bookmarkName, num));
            capChildren.push(new BookmarkEnd(num));
        }

        return [
            new Paragraph({
                children: capChildren,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { before: 2400, after: 400 },
                pageBreakBefore: false
            }),
            new Paragraph({
                children: [new TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })], // Removed .toUpperCase()
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 1200 },
            })
        ];
    };

    const sections: any[] = [];

    const basePageConfig = {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: {
            top: MARGIN_TOP,
            bottom: MARGIN_BOTTOM,
            left: MARGIN_INSIDE,
            right: MARGIN_OUTSIDE,
            header: MARGIN_HEADER,
            footer: MARGIN_FOOTER,
            mirror: true, // APPLIED: Páginas Espelho (Mirror Margins)
            gutter: 0 // Gutter is handled by Inside Margin (1.93cm)
        },
    };

    // -------------------------------------------------------------------------
    // STRICT PAGE STRUCTURE (1-11)
    // -------------------------------------------------------------------------

    // PÁGINA 1 (Direita/Ímpar) - FOLHA DE ROSTO (Half Title)
    sections.push({
        properties: {
            page: { ...basePageConfig, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } },
            type: SectionType.NEXT_PAGE,
            verticalAlign: VerticalAlign.CENTER
        },
        children: [
            new Paragraph({
                children: [new TextRun({ text: metadata.bookTitle || "TÍTULO", bold: true, font: "Garamond", size: 52 })],
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                children: [new TextRun({ text: metadata.subTitle || "", italics: false, font: "Garamond", size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 2 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: AlignmentType.CENTER
            })
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 3 (Direita/Ímpar) - PÁGINA DE TÍTULO
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: metadata.authorName || "Autor", font: "Garamond", bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0 },
            }),
            new Paragraph({
                children: [new TextRun({ text: metadata.bookTitle || "", bold: true, font: "Garamond", size: 52 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
            new Paragraph({
                children: [new TextRun({ text: metadata.subTitle || "", font: "Garamond", size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
            }),
            new Paragraph({
                children: [new TextRun({ text: "Editora 360 Express", bold: true, font: "Garamond", size: 32, color: "000000" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 4 (Esquerda/Par) - FICHA CATALOGRÁFICA / ISBN
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.BOTTOM },
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: "[PÁGINA DESTINADA AS INFORMAÇÕES DE REGISTRO DO LIVRO – FICHA CATALOGRÁFICA E ISBN]", font: "Arial", size: 20, color: "888888" }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 1000 }
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 5 (Direita/Ímpar) - AGRADECIMENTO
    // (Force placement even if empty to maintain structure)
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "AGRADECIMENTOS", bold: true, font: "Garamond", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2000 } // Push content down slightly if needed, but VerticalAlign.CENTER does most work
            }),
            ...(content.acknowledgments ? createTextParams(content.acknowledgments) : [new Paragraph({
                children: [new TextRun({ text: "[Espaço para Agradecimentos]", font: "Garamond", size: 24 })],
                alignment: AlignmentType.CENTER
            })])
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 6 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: AlignmentType.CENTER
            })
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 7 (Direita/Ímpar) - DEDICATÓRIA
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "DEDICATÓRIA", bold: true, font: "Garamond", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2000 }
            }),
            new Paragraph({
                children: [new TextRun({ text: content.dedication || "[Espaço para Dedicatória]", font: "Garamond", size: 24, italics: false })],
                alignment: AlignmentType.CENTER,
                indent: { left: 1440, right: 1440 }
            })
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 8 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: VerticalAlign.CENTER },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: AlignmentType.CENTER
            })
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 9 (Direita) + 10 (Esquerda) - SUMÁRIO
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "SUMÁRIO", bold: true, font: "Garamond", size: 48 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 1200, after: 800 }
            }),
            new TableOfContents("Sumário", {
                hyperlink: true,
                headingStyleRange: "1-2",
                stylesWithLevels: [
                    new StyleLevel("Heading 1", 1),
                    new StyleLevel("Heading 2", 2),
                ],
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // PÁGINA 11 - INTRODUÇÃO
    if (content.introduction) {
        sections.push({
            properties: {
                page: { ...basePageConfig, pageNumbers: { start: 11, formatType: NumberFormat.DECIMAL } }, // FORCE START 11
                type: SectionType.ODD_PAGE, // Ensure it falls on odd page (11 usually is)
                titlePage: true,
            },
            children: [
                new Paragraph({
                    children: [new TextRun({ text: "INTRODUÇÃO", bold: true, font: "Garamond", size: 48 })],
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2400, after: 1200 },
                    pageBreakBefore: false
                }),
                ...createTextParams(content.introduction)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new Header({ children: [] }),
            },
            footers: {
                default: createFooter(),
                even: createFooter(),
                first: createFooter(),
            }
        });
    }

    // 9. Chapters
    content.chapters.forEach((chapter, index) => {
        const cleanTitle = sanitizeText(chapter.title).replace(/\*/g, '');
        sections.push({
            properties: {
                page: basePageConfig,
                type: SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                // Chapter Number (Visual Only)
                new Paragraph({
                    children: [new TextRun({ text: `CAPÍTULO ${index + 1}`, bold: true, font: "Garamond", size: 48 })],
                    heading: HeadingLevel.HEADING_1, // Included in TOC as Level 1
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 2400, after: 400 },
                }),
                // Chapter Title (Visual Only)
                new Paragraph({
                    children: [new TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })],
                    heading: HeadingLevel.HEADING_2, // Included in TOC as Level 2 (Indented)
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 1200 },
                }),
                ...createTextParams(chapter.content)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new Header({ children: [] }),
            },
            footers: {
                default: createFooter(),
                even: createFooter(),
                first: createFooter(),
            }
        });
    });

    // 10. Conclusion
    if (content.conclusion) {
        sections.push({
            properties: {
                page: basePageConfig,
                type: SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                createTitle("Conclusão"),
                ...createTextParams(content.conclusion)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new Header({ children: [] }),
            },
            footers: {
                default: createFooter(),
                even: createFooter(),
                first: createFooter(),
            }
        });
    }

    // 11. Sobre o Autor (Conditional)
    const authorName = metadata.authorName || "Autor";
    const firstName = authorName.trim().split(" ")[0].toLowerCase();

    // Heuristic: Ends in 'a' -> Female (mostly). 
    // Exceptions like 'Luca', 'Jean' can be added if needed, but for now simple is better.
    const isFemale = firstName.endsWith('a') && firstName !== 'luca';
    const authorTitle = isFemale ? "SOBRE A AUTORA" : "SOBRE O AUTOR";

    // Detect Plan from Metadata (Tag or Explicit Plan object)
    // tag might be "Id_STARTER_monthly" or "Nível 2 (STARTER)"
    const safeMetadata = metadata as any;
    const planTag = (safeMetadata.tag || "").toUpperCase();
    const explicitPlan = safeMetadata.plan?.name?.toUpperCase() || "";

    const isProOrBlack = planTag.includes('PRO') || planTag.includes('BLACK') ||
        explicitPlan.includes('PRO') || explicitPlan.includes('BLACK');

    const aboutContent = isProOrBlack && content.aboutAuthor
        ? createTextParams(content.aboutAuthor)
        : [new Paragraph({
            children: [new TextRun({ text: "[Espaço para Sobre o Autor]", color: "000000", italics: false })],
            alignment: AlignmentType.CENTER
        })];

    sections.push({
        properties: {
            page: basePageConfig,
            verticalAlign: VerticalAlign.CENTER, // Force Center
            type: SectionType.ODD_PAGE,
            titlePage: true,
        },
        children: [
            new Paragraph({
                children: [new TextRun({ text: authorTitle, bold: true, font: "Garamond", size: 24 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 2000 }
            }),
            ...aboutContent
        ],
        headers: {
            default: createHeader(metadata.bookTitle || ""),
            even: createHeader(metadata.authorName),
            first: new Header({ children: [] }),
        },
        footers: {
            default: createFooter(),
            even: createFooter(),
            first: createFooter(),
        }
    });

    const doc = new Document({
        creator: "Book Factory AI",
        title: metadata.bookTitle,
        description: metadata.subTitle,
        features: {
            updateFields: true
        },
        sections: sections,
        styles: {
            default: {
                document: {
                    run: { font: "Garamond", size: 27 }, // 13.5pt
                    paragraph: { spacing: { line: 360 } }
                }
            }
        }
    });

    return Packer.toBuffer(doc);
};
