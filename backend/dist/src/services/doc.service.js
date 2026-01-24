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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookDocx = void 0;
const docx_1 = require("docx");
const archiver_1 = __importDefault(require("archiver"));
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
const generateBookDocx = (project) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    console.log(`[DocService] Generating DOCX for ID: ${project.id} | Title: ${project.metadata.bookTitle}`);
    if (!project.structure) {
        console.error("[DocService] FATAL: project.structure is UNDEFINED");
        project.structure = [];
    }
    // 1. Prepare Content Object
    const introChapter = project.structure.find(c => c.id === 0 || ['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));
    const mainChapters = project.structure.filter(c => c.id !== 0 && !['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));
    mainChapters.sort((a, b) => a.id - b.id);
    const content = {
        introduction: introChapter ? introChapter.content : "",
        chapters: mainChapters,
        conclusion: "",
        dedication: project.metadata.dedication || "",
        acknowledgments: project.metadata.acknowledgments || "",
        aboutAuthor: project.metadata.aboutAuthor || "",
        marketing: project.marketing || { text: "", viralHooks: [], description: "", keywords: [], targetAudience: "", salesSynopsis: "", youtubeDescription: "", backCover: "" }
    };
    // 2. Generate Buffer
    const buffer = yield createDocxBuffer(project.metadata, content);
    // 3. Save File Locally
    const safeEmail = ((_b = (_a = project.metadata.contact) === null || _a === void 0 ? void 0 : _a.email) === null || _b === void 0 ? void 0 : _b.replace(/[^a-zA-Z0-9._-]/g, '_')) || `project_${project.id}`;
    // Ensure directory exists
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');
    if (!fs.existsSync(outputDir)) {
        try {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        catch (err) { }
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
            const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
            archive.pipe(output);
            // Add Book
            archive.append(buffer, { name: project.metadata.bookTitle ? `${project.metadata.bookTitle}.docx` : 'Livro.docx' });
            // Helper to add docx string
            const addDoc = (name, title, content) => __awaiter(void 0, void 0, void 0, function* () {
                const b = yield createSimpleDocx(title, content);
                archive.append(b, { name: name });
            });
            const m = project.marketing;
            if (m.salesSynopsis)
                yield addDoc('Sinopse_Amazon.docx', 'Sinopse Amazon', m.salesSynopsis);
            if (m.backCover)
                yield addDoc('Texto_Contra_Capa.docx', 'Texto da Contra Capa', m.backCover);
            if (m.flapCopy)
                yield addDoc('Texto_Orelha_Capa.docx', 'Texto da Orelha da Capa', m.flapCopy);
            if (m.backFlapCopy)
                yield addDoc('Texto_Orelha_Contra_Capa.docx', 'Texto da Orelha da Contra Capa', m.backFlapCopy);
            if (m.youtubeDescription)
                yield addDoc('Youtube_Descricao.docx', 'Descrição Youtube', m.youtubeDescription);
            if (m.keywords && m.keywords.length > 0)
                yield addDoc('Palavras_Chave.docx', 'Palavras Chave', m.keywords.join(', '));
            if (content.marketing && content.marketing.description)
                yield addDoc('Sinopse_Padrao_Profissional_Amazon.docx', 'SINOPSE PADRÃO PROFISSIONAL AMAZON', content.marketing.description);
            // Close archive
            yield archive.finalize();
            // Wait for close
            yield new Promise((resolve, reject) => {
                output.on('close', resolve);
                output.on('error', reject);
            });
            console.log(`Generated ZIP Package at ${zipPath}`);
            finalArtifactPath = zipPath;
        }
        catch (err) {
            console.error("Error zipping extras:", err);
        }
    }
    return finalArtifactPath; // Returns local ABSOLUTE path
});
exports.generateBookDocx = generateBookDocx;
const createSimpleDocx = (title, content) => __awaiter(void 0, void 0, void 0, function* () {
    // robust split by newline pattern
    const lines = content.split(/\r?\n/);
    const children = [];
    // Add Title
    children.push(new docx_1.Paragraph({
        children: [new docx_1.TextRun({ text: title, bold: true, size: 36, font: "Arial", color: "2E74B5" })],
        spacing: { after: 400 },
        alignment: docx_1.AlignmentType.CENTER
    }));
    // Process Lines
    lines.forEach(line => {
        const text = line.trim();
        if (!text) {
            // Empty line = Spacing
            children.push(new docx_1.Paragraph({ children: [], spacing: { after: 200 } }));
            return;
        }
        // Check for "___" separator (User wants literal lines sometimes, but borders are nicer in Word)
        // User example explicitly used "________________________________________"
        // Let's replace with a real border for professional look
        if (text.match(/^_{3,}/) || text.match(/^-{3,}/)) {
            children.push(new docx_1.Paragraph({
                border: { bottom: { color: "CCCCCC", space: 10, style: docx_1.BorderStyle.SINGLE, size: 6 } },
                spacing: { after: 240, before: 120 },
                children: []
            }));
            return;
        }
        // Check for Headers (ALL CAPS ending in ? or :) or starting with Emojis like 📘, 🔥, 🛑
        // Also check explicitly for lines starting with 'Task', 'Step' etc if we wanted, but sticking to visual cues.
        const isHeader = /^[A-ZÁÉÍÓÚÃÕÀÂÊÔÇ0-9\s\?(!)]+[:\?]$/.test(text) ||
            /^[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);
        children.push(new docx_1.Paragraph({
            children: [new docx_1.TextRun({
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
    const doc = new docx_1.Document({
        sections: [{
                properties: {},
                children: children
            }]
    });
    return docx_1.Packer.toBuffer(doc);
});
const createDocxBuffer = (metadata, content) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Helper: Load Asset safely
    const loadAsset = (filename) => {
        try {
            // Check assets folder? Or just skip for now as we don't have frontend public folder access easily.
            // But we might have them in backend/assets?
            // User didn't specify backend assets.
            // Let's assume we skip logo/qr for now or use placeholders if we could.
            // Logic in frontend: fetch('/logo_editora.png').
            // We can't fetch localhost easily inside docker/process if not running static server for it.
            return null;
        }
        catch (e) {
            return null;
        }
    };
    const logoBuffer = loadAsset('logo_editora.png');
    const qrBuffer = loadAsset('qr_code.png');
    // --- Helper Functions ---
    const createHeader = (text) => {
        return new docx_1.Header({
            children: [
                new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text, font: "Garamond", size: 24 })], // 12pt Header
                    alignment: docx_1.AlignmentType.CENTER,
                    spacing: { after: 160 },
                }),
            ],
        });
    };
    const createFooter = () => {
        return new docx_1.Footer({
            children: [
                new docx_1.Paragraph({
                    children: [
                        new docx_1.TextRun({
                            children: [docx_1.PageNumber.CURRENT],
                            font: "Garamond",
                            size: 24,
                        }),
                    ],
                    alignment: docx_1.AlignmentType.CENTER,
                }),
            ],
        });
    };
    const sanitizeText = (text) => {
        let clean = text || "";
        clean = clean.replace(/#{1,6}\s?/g, "");
        clean = clean.replace(/^\s*[-_*]{3,}\s*$/gm, "");
        clean = clean.replace(/\n{3,}/g, "\n\n"); // Squash excessive whitespace
        return clean;
    };
    const createTextParams = (text) => {
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
                if (!trimmed)
                    return;
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
            if (buffer.trim())
                newText += buffer.trim();
            cleanText = newText;
        }
        // FORCE SPLIT BY SINGLE NEWLINE TO ENSURE PARAGRAPHS
        const paragraphs = cleanText.split('\n').filter(p => p.trim().length > 0);
        return paragraphs.map(p => {
            const parts = p.split(/(\*\*.*?\*\*)/g);
            const children = parts.map(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return new docx_1.TextRun({ text: part.slice(2, -2).replace(/\*/g, ''), bold: true, font: "Garamond", size: 27 }); // 13.5pt
                }
                return new docx_1.TextRun({ text: part.replace(/\*/g, ''), font: "Garamond", size: 27 }); // 13.5pt
            });
            return new docx_1.Paragraph({
                children: children,
                alignment: docx_1.AlignmentType.JUSTIFIED,
                spacing: { after: 200, line: 360 }, // 1.5 Line Spacing
                indent: { firstLine: 708 }, // 1.25 cm
            });
        });
    };
    const createTitle = (title, breakPage = false, bookmarkName, bookmarkId) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        const textRun = new docx_1.TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 });
        let pChildren = [textRun];
        if (bookmarkName && bookmarkId !== undefined) {
            pChildren = [new docx_1.BookmarkStart(bookmarkName, bookmarkId), textRun, new docx_1.BookmarkEnd(bookmarkId)];
        }
        return new docx_1.Paragraph({
            children: pChildren,
            heading: docx_1.HeadingLevel.HEADING_1,
            alignment: docx_1.AlignmentType.CENTER,
            spacing: { before: 2400, after: 1200 },
            pageBreakBefore: breakPage
        });
    };
    const createChapterNumberTitle = (num, title, bookmarkName) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        const capChildren = [new docx_1.TextRun({ text: `CAPÍTULO ${num}`, bold: true, font: "Garamond", size: 48 })];
        if (bookmarkName) {
            // Fix: BookmarkStart(name: string, id: number) based on type feedback
            capChildren.unshift(new docx_1.BookmarkStart(bookmarkName, num));
            capChildren.push(new docx_1.BookmarkEnd(num));
        }
        return [
            new docx_1.Paragraph({
                children: capChildren,
                heading: docx_1.HeadingLevel.HEADING_2,
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 2400, after: 400 },
                pageBreakBefore: false
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })], // Removed .toUpperCase()
                heading: docx_1.HeadingLevel.HEADING_1,
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 200, after: 1200 },
            })
        ];
    };
    const sections = [];
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
            page: Object.assign(Object.assign({}, basePageConfig), { pageNumbers: { start: 1, formatType: docx_1.NumberFormat.LOWER_ROMAN } }),
            type: docx_1.SectionType.NEXT_PAGE,
            verticalAlign: docx_1.VerticalAlign.CENTER
        },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: metadata.bookTitle || "TÍTULO", bold: true, font: "Garamond", size: 52 })],
                alignment: docx_1.AlignmentType.CENTER,
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: metadata.subTitle || "", italics: false, font: "Garamond", size: 32 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 2 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: docx_1.AlignmentType.CENTER
            })
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 3 (Direita/Ímpar) - PÁGINA DE TÍTULO
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: metadata.authorName || "Autor", font: "Garamond", bold: true, size: 32 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 0 },
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: metadata.bookTitle || "", bold: true, font: "Garamond", size: 52 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: metadata.subTitle || "", font: "Garamond", size: 32 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 200 },
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "Editora 360 Express", bold: true, font: "Garamond", size: 32, color: "000000" })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 400 },
            }),
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 4 (Esquerda/Par) - FICHA CATALOGRÁFICA / ISBN
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.BOTTOM },
        children: [
            new docx_1.Paragraph({
                children: [
                    new docx_1.TextRun({ text: "[PÁGINA DESTINADA AS INFORMAÇÕES DE REGISTRO DO LIVRO – FICHA CATALOGRÁFICA E ISBN]", font: "Arial", size: 20, color: "888888" }),
                ],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 1000 }
            }),
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 5 (Direita/Ímpar) - AGRADECIMENTO
    // (Force placement even if empty to maintain structure)
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "AGRADECIMENTOS", bold: true, font: "Garamond", size: 24 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 2000 } // Push content down slightly if needed, but VerticalAlign.CENTER does most work
            }),
            ...(content.acknowledgments ? createTextParams(content.acknowledgments) : [new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text: "[Espaço para Agradecimentos]", font: "Garamond", size: 24 })],
                    alignment: docx_1.AlignmentType.CENTER
                })])
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 6 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: docx_1.AlignmentType.CENTER
            })
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 7 (Direita/Ímpar) - DEDICATÓRIA
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "DEDICATÓRIA", bold: true, font: "Garamond", size: 24 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 2000 }
            }),
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: content.dedication || "[Espaço para Dedicatória]", font: "Garamond", size: 24, italics: false })],
                alignment: docx_1.AlignmentType.CENTER,
                indent: { left: 1440, right: 1440 }
            })
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 8 (Esquerda/Par) - BRANCO
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig, verticalAlign: docx_1.VerticalAlign.CENTER },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "[ESTÁ PÁGINA TEM QUE PERMANECER EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: docx_1.AlignmentType.CENTER
            })
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 9 (Direita) + 10 (Esquerda) - SUMÁRIO
    sections.push({
        properties: { type: docx_1.SectionType.NEXT_PAGE, page: basePageConfig },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "SUMÁRIO", bold: true, font: "Garamond", size: 48 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { before: 1200, after: 800 }
            }),
            new docx_1.TableOfContents("Sumário", {
                hyperlink: true,
                headingStyleRange: "1-2",
                stylesWithLevels: [
                    new docx_1.StyleLevel("Heading 1", 1),
                    new docx_1.StyleLevel("Heading 2", 2),
                ],
            }),
        ],
        headers: { default: new docx_1.Header({ children: [] }) },
        footers: { default: new docx_1.Footer({ children: [] }) },
    });
    // PÁGINA 11 - INTRODUÇÃO
    if (content.introduction) {
        sections.push({
            properties: {
                page: Object.assign(Object.assign({}, basePageConfig), { pageNumbers: { start: 11, formatType: docx_1.NumberFormat.DECIMAL } }), // FORCE START 11
                type: docx_1.SectionType.ODD_PAGE, // Ensure it falls on odd page (11 usually is)
                titlePage: true,
            },
            children: [
                new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text: "INTRODUÇÃO", bold: true, font: "Garamond", size: 48 })],
                    heading: docx_1.HeadingLevel.HEADING_1,
                    alignment: docx_1.AlignmentType.CENTER,
                    spacing: { before: 2400, after: 1200 },
                    pageBreakBefore: false
                }),
                ...createTextParams(content.introduction)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new docx_1.Header({ children: [] }),
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
                type: docx_1.SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                // Chapter Number (Visual Only)
                new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text: `CAPÍTULO ${index + 1}`, bold: true, font: "Garamond", size: 48 })],
                    heading: docx_1.HeadingLevel.HEADING_1, // Included in TOC as Level 1
                    alignment: docx_1.AlignmentType.CENTER,
                    spacing: { before: 2400, after: 400 },
                }),
                // Chapter Title (Visual Only)
                new docx_1.Paragraph({
                    children: [new docx_1.TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })],
                    heading: docx_1.HeadingLevel.HEADING_2, // Included in TOC as Level 2 (Indented)
                    alignment: docx_1.AlignmentType.CENTER,
                    spacing: { before: 200, after: 1200 },
                }),
                ...createTextParams(chapter.content)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new docx_1.Header({ children: [] }),
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
                type: docx_1.SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                createTitle("Conclusão"),
                ...createTextParams(content.conclusion)
            ],
            headers: {
                default: createHeader(metadata.bookTitle || ""),
                even: createHeader(metadata.authorName),
                first: new docx_1.Header({ children: [] }),
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
    const safeMetadata = metadata;
    const planTag = (safeMetadata.tag || "").toUpperCase();
    const explicitPlan = ((_b = (_a = safeMetadata.plan) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toUpperCase()) || "";
    const isProOrBlack = planTag.includes('PRO') || planTag.includes('BLACK') ||
        explicitPlan.includes('PRO') || explicitPlan.includes('BLACK');
    const aboutContent = isProOrBlack && content.aboutAuthor
        ? createTextParams(content.aboutAuthor)
        : [new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: "[Espaço para Sobre o Autor]", color: "000000", italics: false })],
                alignment: docx_1.AlignmentType.CENTER
            })];
    sections.push({
        properties: {
            page: basePageConfig,
            verticalAlign: docx_1.VerticalAlign.CENTER, // Force Center
            type: docx_1.SectionType.ODD_PAGE,
            titlePage: true,
        },
        children: [
            new docx_1.Paragraph({
                children: [new docx_1.TextRun({ text: authorTitle, bold: true, font: "Garamond", size: 24 })],
                alignment: docx_1.AlignmentType.CENTER,
                spacing: { after: 2000 }
            }),
            ...aboutContent
        ],
        headers: {
            default: createHeader(metadata.bookTitle || ""),
            even: createHeader(metadata.authorName),
            first: new docx_1.Header({ children: [] }),
        },
        footers: {
            default: createFooter(),
            even: createFooter(),
            first: createFooter(),
        }
    });
    const doc = new docx_1.Document({
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
    return docx_1.Packer.toBuffer(doc);
});
