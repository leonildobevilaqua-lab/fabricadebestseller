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
    SectionVerticalAlign
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';
import { BookProject, BookContent, BookMetadata } from '../types';

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
    console.log(`[DocService] Structure Length: ${project.structure.length}`);

    // 1. Prepare Content Object
    const introChapter = project.structure.find(c => c.id === 0 || ['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));
    const mainChapters = project.structure.filter(c => c.id !== 0 && !['introdução', 'introduction', 'intro'].some(term => c.title.toLowerCase().includes(term)));

    // Sort chapters by ID or order
    mainChapters.sort((a, b) => a.id - b.id);

    const content: BookContent = {
        introduction: introChapter ? introChapter.content : "",
        chapters: mainChapters,
        conclusion: "", // If separate conclusion exists, add logic
        dedication: project.metadata.dedication || "",
        acknowledgments: project.metadata.acknowledgments || "",
        aboutAuthor: project.metadata.aboutAuthor || "",
        marketing: project.marketing || {
            viralHooks: [], description: "", keywords: [], targetAudience: "", salesSynopsis: "", youtubeDescription: "", backCover: ""
        }
    };

    // 2. Generate Buffer
    const buffer = await createDocxBuffer(project.metadata, content);

    // 3. Save File
    // 3. Save File (Redundant naming for safety)
    const safeEmail = project.metadata.contact?.email?.replace(/[^a-zA-Z0-9._-]/g, '_') || `project_${project.id}`;
    const outputDir = path.join(__dirname, '../../generated_books');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // SAVE 1: Email-based (Legacy support)
    const outputPath = path.join(outputDir, `book_${safeEmail}.docx`);
    fs.writeFileSync(outputPath, buffer);

    // SAVE 2: ProjectID-based (New Robust Standard)
    const outputPathID = path.join(outputDir, `book_project_${project.id}.docx`);
    fs.writeFileSync(outputPathID, buffer);

    console.log(`Generated High-Quality DOCX at ${outputPathID}`);

    let finalArtifactPath = outputPathID; // Default to ID one

    // 4. Generate Extras & Zip (If Marketing exists)
    if (project.marketing) {
        try {
            const zipName = `kit_completo_${safeEmail}.zip`;
            const zipPath = path.join(outputDir, zipName);

            const zipNameID = `kit_completo_project_${project.id}.zip`;
            const zipPathID = path.join(outputDir, zipNameID);

            // We create ONE zip stream and verify if we can copy it, 
            // OR just create two for simplicity (overhead is negligible for text).
            // Let's create the ID one as Primary, then copy to Email one.

            const output = fs.createWriteStream(zipPathID);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);

            // Add Book
            archive.file(outputPath, { name: project.metadata.bookTitle ? `${project.metadata.bookTitle}.docx` : 'Livro.docx' });

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
            if (content.marketing.description) await addDoc('Descricao_Geral.docx', 'Descrição Geral', content.marketing.description);


            await archive.finalize();

            // Wait for zip to finish? Archiver finalize returns promise but stream needs close?
            // Usually await archive.finalize() is enough to flush.
            // But we need to wait for 'close' event on stream?
            // For simplicity in async function:
            await new Promise<void>((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject);
            });

            console.log(`Generated ZIP Package at ${zipPathID}`);

            // Legacy Support: Copy ID-Zip to Email-Zip
            fs.copyFileSync(zipPathID, zipPath);

            finalArtifactPath = zipPathID;

        } catch (err) {
            console.error("Error zipping extras:", err);
            // Fallback to DOCX only
        }
    }

    // --- AUTOMATIC BACKUP TO "GOOGLE DRIVE" FOLDERS (LOCAL SIMULATION) ---
    // User requested backups. We will save copies to specific folders.
    try {
        const isDiagramming = project.metadata.topic === 'Livro Pré-Escrito' || (project.metadata as any).details?.originalName;
        const backupRoot = path.join(__dirname, '../../BACKUPS');
        const backupDir = path.join(backupRoot, isDiagramming ? 'Livros Diagramados' : 'Livros Gerados');

        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

        // Add timestamp to avoid overwrites
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = path.extname(finalArtifactPath);
        const backupFilename = `backup_${safeEmail}_${timestamp}${ext}`;
        const backupPath = path.join(backupDir, backupFilename);

        fs.copyFileSync(finalArtifactPath, backupPath);
        console.log(`Backup saved to: ${backupPath}`);
    } catch (err) {
        console.error("Backup Error:", err);
    }
    // ---------------------------------------------------------------------

    return finalArtifactPath;
};

const createSimpleDocx = async (title: string, content: string): Promise<Buffer> => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    children: [new TextRun({ text: title, bold: true, size: 32, font: "Arial" })],
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: content, size: 24, font: "Arial" })]
                })
            ]
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

        // If average chars per paragraph is > 600 (approx 10 lines), OR total length > 400 with 0 newlines
        if (avgCharsPerLine > 600 || (cleanText.length > 400 && newlineCount < 2)) {
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

                // Break every 2 sentences OR if buffer > 350 chars
                // Also break immediately if the sentence itself was huge (which shouldn't happen with sentence split but safe to check)
                if (sentenceCount >= 2 || buffer.length > 350) {
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

    const createTitle = (title: string, breakPage: boolean = false) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        return new Paragraph({
            children: [new TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })],
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 2400, after: 1200 },
            pageBreakBefore: breakPage
        });
    };

    const createChapterNumberTitle = (num: number, title: string) => {
        const cleanTitle = sanitizeText(title).replace(/\*/g, '');
        return [
            new Paragraph({
                children: [new TextRun({ text: `CAPÍTULO ${num}`, bold: true, font: "Garamond", size: 48 })],
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
            mirror: true
        },
    };

    // 1. Half Title (Página 1 - Ímpar)
    sections.push({
        properties: {
            page: { ...basePageConfig, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } },
            type: SectionType.NEXT_PAGE,
            verticalAlign: VerticalAlign.CENTER // Ensure Perfect Vertical Centering
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

    // 2. Blank Page
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "[ATENÇÃO ESTÁ PÁGINA DEVERÁ ESTAR EM BRANCO]", color: "FFFFFF", size: 20 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 4000 }
            })
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // 3. Title Page - Vertically Centered
    sections.push({
        properties: {
            type: SectionType.NEXT_PAGE,
            page: basePageConfig,
            verticalAlign: VerticalAlign.CENTER
        },
        children: [
            new Paragraph({
                children: [new TextRun({ text: metadata.authorName || "Autor", font: "Garamond", bold: true, size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0 }, // Top
            }),
            new Paragraph({
                children: [new TextRun({ text: metadata.bookTitle || "", bold: true, font: "Garamond", size: 52 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }, // Reduced spacing
            }),
            new Paragraph({
                children: [new TextRun({ text: metadata.subTitle || "", font: "Garamond", size: 32 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 }, // Reduced spacing
            }),
            new Paragraph({
                children: [new TextRun({ text: "Editora 360 Express", bold: true, font: "Garamond", size: 32, color: "000000" })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400 }, // Reduced closer to subtitle
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // 4. Credits & CIP - Center, Simple text
    sections.push({
        properties: {
            type: SectionType.NEXT_PAGE,
            page: basePageConfig,
            verticalAlign: VerticalAlign.CENTER
        },
        children: [
            new Paragraph({
                children: [
                    new TextRun({ text: "[PÁGINA DESTINADA PARA FICHA CATALOGRÁFICA E ISBN DO LIVRO]", font: "Arial", size: 24, bold: true, color: "888888" }),
                ],
                alignment: AlignmentType.CENTER,
            }),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // 5. Acknowledgments
    if (content.acknowledgments) {
        sections.push({
            properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
            children: [
                createTitle("AGRADECIMENTO"),
                ...createTextParams(content.acknowledgments)
            ],
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
        });
        // Blank after
        sections.push({
            properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
            children: [new Paragraph({ children: [new TextRun({ text: ".", color: "FFFFFF" })] })],
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
        });
    }

    // 6. Dedication
    if (content.dedication) {
        sections.push({
            properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
            children: [
                createTitle("DEDICATÓRIA"),
                new Paragraph({
                    children: [new TextRun({ text: content.dedication, italics: false, font: "Garamond", size: 27 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 4000 },
                })
            ],
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
        });
        // Blank after
        sections.push({
            properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
            children: [new Paragraph({ children: [new TextRun({ text: ".", color: "FFFFFF" })] })],
            headers: { default: new Header({ children: [] }) },
            footers: { default: new Footer({ children: [] }) },
        });
    }

    // 7. Table of Contents (Simplified)
    sections.push({
        properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
        children: [
            new Paragraph({
                children: [new TextRun({ text: "SUMÁRIO", bold: true, font: "Garamond", size: 48 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 1200, after: 800 }
            }),
            ...content.chapters.map((c, i) => new Paragraph({
                children: [
                    new TextRun({ text: `CAPÍTULO ${i + 1}: `, bold: true, font: "Garamond", size: 24 }),
                    new TextRun({ text: c.title.toUpperCase(), font: "Garamond", size: 24 }),
                    new TextRun({ text: `\t${14 + (i * 10)}`, font: "Garamond", size: 24 })
                ],
                tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: "dot" as any }],
                spacing: { after: 200 },
                alignment: AlignmentType.LEFT
            })),
        ],
        headers: { default: new Header({ children: [] }) },
        footers: { default: new Footer({ children: [] }) },
    });

    // 8. Introduction
    if (content.introduction) {
        sections.push({
            properties: {
                page: { ...basePageConfig, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } }, // Restart numeric here? Frontend restart at 11.
                type: SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                createTitle("Introdução"),
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
        sections.push({
            properties: {
                page: basePageConfig,
                type: SectionType.ODD_PAGE,
                titlePage: true,
            },
            children: [
                ...createChapterNumberTitle(index + 1, chapter.title),
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

    const doc = new Document({
        creator: "Book Factory AI",
        title: metadata.bookTitle,
        description: metadata.subTitle,

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
