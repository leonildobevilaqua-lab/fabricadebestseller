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
  TabStopPosition
} from 'docx';
import { BookMetadata, BookContent } from '../types';

// Measurements for 6" x 9" (152.4mm x 228.6mm)
const TWIPS_PER_INCH = 1440;
const TWIPS_PER_CM = 567;
const PAGE_WIDTH = 6 * TWIPS_PER_INCH;
const PAGE_HEIGHT = 9 * TWIPS_PER_INCH;

// Margins (User Requested)
// Superior: 1,52 cm | Inferior: 1,52 cm | Externa: 1,52 cm
// Interna: 1,93 cm
// Cabeçalho/Rodapé: 0,89 cm
const MARGIN_TOP = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_BOTTOM = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_INSIDE = Math.round(1.93 * TWIPS_PER_CM);
const MARGIN_OUTSIDE = Math.round(1.52 * TWIPS_PER_CM);
const MARGIN_HEADER = Math.round(0.89 * TWIPS_PER_CM);
const MARGIN_FOOTER = Math.round(0.89 * TWIPS_PER_CM);

export const generateDocx = async (metadata: BookMetadata, content: BookContent): Promise<Blob> => {

  // Fetch Logo & QR Code
  let logoBuffer: ArrayBuffer | null = null;
  let qrBuffer: ArrayBuffer | null = null;

  try {
    const [logoRes, qrRes] = await Promise.all([
      fetch('/logo_editora.png'),
      fetch(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://instagram.com/editora360express`)
    ]);

    if (logoRes.ok) logoBuffer = await logoRes.arrayBuffer();
    if (qrRes.ok) qrBuffer = await qrRes.arrayBuffer();

  } catch (e) {
    console.warn("Could not load assets", e);
  }

  // --- Helper Functions ---

  const createHeader = (text: string) => {
    return new Header({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: "Garamond", size: 24 })], // 12pt Header
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 }, // 8pt padding
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
              size: 24, // 12pt Footer
            }),
          ],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });
  };

  // Sanitization Function
  const sanitizeText = (text: string): string => {
    let clean = text || "";
    clean = clean.replace(/#{1,6}\s?/g, "");
    clean = clean.replace(/^\s*[-_*]{3,}\s*$/gm, "");
    return clean;
  };

  const createTextParams = (text: string) => {
    const cleanText = sanitizeText(text);
    const paragraphs = cleanText.split('\n\n').filter(p => p.trim().length > 0);
    return paragraphs.map(p => {
      const parts = p.split(/(\*\*.*?\*\*)/g);
      const children = parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return new TextRun({ text: part.slice(2, -2).replace(/\*/g, ''), bold: true, font: "Garamond", size: 27 });
        }
        return new TextRun({ text: part.replace(/\*/g, ''), font: "Garamond", size: 27 });
      });

      return new Paragraph({
        children: children,
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200, line: 360 }, // 1.5 Line Spacing, 10pt after
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

  // Helper for Chapter Pre-Title
  const createChapterNumberTitle = (num: number, title: string) => {
    const cleanTitle = sanitizeText(title).replace(/\*/g, '');
    return [
      new Paragraph({
        children: [new TextRun({ text: `CAPÍTULO ${num}`, bold: true, font: "Garamond", size: 48 })], // Uppercase 24pt (48 half-points)
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 400 },
        pageBreakBefore: false
      }),
      new Paragraph({
        children: [new TextRun({ text: cleanTitle.toUpperCase(), bold: true, font: "Garamond", size: 48 })], // Uppercase
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

  // --- BOOK STRUCTURE IMPLEMENTATION ---

  // 1. Half Title (Página 1 - Ímpar)
  sections.push({
    properties: {
      page: { ...basePageConfig, pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN } },
      type: SectionType.NEXT_PAGE,
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: metadata.bookTitle, bold: true, font: "Garamond", size: 52 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 5000 },
      }),
      new Paragraph({
        children: [new TextRun({ text: metadata.subTitle, italics: false, font: "Garamond", size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 2. Blank Page (Página 2 - Par) - With Invisible Warning
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "[ATENÇÃO ESTÁ PÁGINA DEVERÁ ESTAR EM BRANCO - NÃO ESCREVA ABSOLUTAMENTE NADA NESTÁ PÁGINA]", color: "FFFFFF", size: 20 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 4000 }
      })
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 3. Title Page (Página 3 - Ímpar) - Centered
  sections.push({
    properties: {
      type: SectionType.NEXT_PAGE,
      page: basePageConfig,
    },
    children: [
      // Author (Top of Page)
      new Paragraph({
        children: [new TextRun({ text: metadata.authorName, font: "Garamond", bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0 }, // Top
      }),
      // Title (Middle of Page - Approx 8cm down)
      new Paragraph({
        children: [new TextRun({ text: metadata.bookTitle, bold: true, font: "Garamond", size: 52 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 5000 }, // Push to middle
      }),
      // Subtitle
      new Paragraph({
        children: [new TextRun({ text: metadata.subTitle, font: "Garamond", size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
      // Logo (Bottom of Page - Approx 8cm down from title)
      new Paragraph({
        children: logoBuffer ? [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 135, height: 60 }, // 3.58cm x 1.58cm
          })
        ] : [
          new TextRun({ text: "Editora 360 Express", bold: true, font: "Garamond", size: 32, color: "000000" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 5000 }, // Push to bottom
      }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 4. Credits & CIP (Página 4 - Par) - Complex Layout
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      // Top Section: 2 Columns using Table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }
        },
        rows: [
          new TableRow({
            children: [
              // Left Column: Book Info
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: metadata.bookTitle, bold: true, font: "Garamond", size: 24 })], spacing: { after: 200 } }),
                  new Paragraph({ children: [new TextRun({ text: metadata.subTitle, font: "Garamond", size: 24 })], spacing: { after: 400 } }),
                  new Paragraph({ children: [new TextRun({ text: "Leme, SP / " + new Date().getFullYear(), font: "Garamond", size: 24 })], spacing: { after: 400 } }),
                  new Paragraph({ children: [new TextRun({ text: metadata.authorName, bold: true, font: "Garamond", size: 24, color: "990000", underline: { type: "wave", color: "990000" } })], spacing: { after: 200 } }),
                ]
              }),
              // Right Column: Rights, Credits, ISBN, QR
              new TableCell({
                width: { size: 50, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Categoria: Educação / Desenvolvimento", font: "Garamond", size: 20 })], spacing: { after: 200 } }),

                  new Paragraph({ children: [new TextRun({ text: "Todos os direitos reservados em Língua Portuguesa por", font: "Garamond", size: 20 })], spacing: { after: 100 } }),
                  new Paragraph({ children: [new TextRun({ text: metadata.authorName, bold: true, font: "Garamond", size: 20 })], spacing: { after: 200 } }),

                  new Paragraph({ children: [new TextRun({ text: "Coordenação Editorial:", bold: true, font: "Garamond", size: 20 })], spacing: { after: 50 } }),
                  new Paragraph({ children: [new TextRun({ text: "Leonildo Bevilaqua", font: "Garamond", size: 20 })], spacing: { after: 150 } }),

                  new Paragraph({ children: [new TextRun({ text: "Capa & Diagramação:", bold: true, font: "Garamond", size: 20 })], spacing: { after: 50 } }),
                  new Paragraph({ children: [new TextRun({ text: "Leonildo Bevilaqua", font: "Garamond", size: 20 })], spacing: { after: 150 } }),

                  new Paragraph({ children: [new TextRun({ text: "ISBN:", bold: true, font: "Garamond", size: 24 })], spacing: { before: 200, after: 50 } }),
                  new Paragraph({ children: [new TextRun({ text: "[SUBSTITUA O ISBN AQUI]", font: "Garamond", size: 24 })], spacing: { after: 200 } }),

                  logoBuffer ? new Paragraph({ children: [new ImageRun({ data: logoBuffer, transformation: { width: 40, height: 40 } })], spacing: { before: 200, after: 200 } }) : new Paragraph(""),

                  new Paragraph({ children: [new TextRun({ text: "CONTATO COM O AUTOR", bold: true, font: "Garamond", size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 200 } }),
                  new Paragraph({ children: [new TextRun({ text: "@" + (metadata.contact?.name || "seu_instagram"), font: "Garamond", size: 20 })], alignment: AlignmentType.CENTER }),

                  qrBuffer ? new Paragraph({ children: [new ImageRun({ data: qrBuffer, transformation: { width: 100, height: 100 } })], alignment: AlignmentType.CENTER, spacing: { before: 100 } }) : new Paragraph("[QR CODE AQUI]"),
                ]
              })
            ]
          })
        ]
      }),

      // Simplified CIP Box (User Request)
      new Paragraph({
        children: [
          new TextRun({ text: "[PÁGINA DESTINADA PARA FICHA CATALOGRÁFICA E ISBN DO LIVRO]", font: "Arial", size: 24, bold: true, color: "888888" }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 5000 }, // Center on page roughly
      }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 5. Acknowledgments (Página 5 - Ímpar)
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      createTitle("AGRADECIMENTO"),
      ...(content.acknowledgments ? createTextParams(content.acknowledgments) : [new Paragraph("")])
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 6. Blank Page after Agradecimentos (Página 6 - Par)
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "[PÁGINA EM BRANCO - VERSO AGRADECIMENTO]", color: "FFFFFF", size: 20 })],
        alignment: AlignmentType.CENTER,
      })
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 7. Dedication (Página 7 - Ímpar)
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig }, // Explicitly Next (After Blank)
    children: [ // Start Dedication

      createTitle("DEDICATÓRIA"),
      new Paragraph({
        children: [new TextRun({ text: content.dedication || "Dedico este livro...", italics: false, font: "Garamond", size: 27 })],
        alignment: AlignmentType.CENTER, // Requested "no meio da página"? "No meio da página" usually means Vertical Center.
        spacing: { before: 4000 },
      })
    ],
  });

  // 8. Blank Page after Dedication (Página 8 - Par)
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "[PÁGINA EM BRANCO - VERSO DEDICATÓRIA]", color: "FFFFFF", size: 20 })],
        alignment: AlignmentType.CENTER,
      })
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 9. Table of Contents (Página 9 - Ímpar)
  sections.push({
    properties: { type: SectionType.NEXT_PAGE, page: basePageConfig },
    children: [
      new Paragraph({
        children: [new TextRun({ text: "SUMÁRIO", bold: true, font: "Garamond", size: 48 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1200, after: 800 }
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "INTRODUÇÃO", font: "Garamond", size: 24, bold: true }),
          new TextRun({ text: "\t11", font: "Garamond", size: 24, bold: true })
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: "dot" as any }], // Casting as any for safety
        spacing: { after: 200 }
      }),
      ...content.chapters.map((c, i) => new Paragraph({
        children: [
          new TextRun({ text: `CAPÍTULO ${i + 1}: `, bold: true, font: "Garamond", size: 24 }),
          new TextRun({ text: c.title.toUpperCase(), font: "Garamond", size: 24 }),
          new TextRun({ text: `\t${14 + (i * 10)}`, font: "Garamond", size: 24 }) // Fake page calc
        ],
        tabStops: [{ type: TabStopType.RIGHT, position: 9000, leader: "dot" as any }],
        spacing: { after: 200 },
        alignment: AlignmentType.LEFT
      })),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 7. Introduction (Página 11 - Ímpar)
  sections.push({
    properties: {
      page: { ...basePageConfig, pageNumbers: { start: 11, formatType: NumberFormat.DECIMAL } },
      type: SectionType.ODD_PAGE,
      titlePage: true,
    },
    children: [
      createTitle("Introdução"),
      ...createTextParams(content.introduction)
    ],
    headers: {
      default: createHeader(metadata.bookTitle),  // ODD -> Title (Right)
      even: createHeader(metadata.authorName),    // EVEN -> Author (Left/Center)
      first: new Header({ children: [] }),
    },
    footers: {
      default: createFooter(),
      even: createFooter(),
      first: createFooter(),
    }
  });



  // 8. Chapters
  content.chapters.forEach((chapter, index) => {
    sections.push({
      properties: {
        page: basePageConfig,
        type: SectionType.ODD_PAGE, // Force Start Next Chapter ODD
        titlePage: true, // No header on first page of chapter
      },
      children: [
        ...createChapterNumberTitle(index + 1, chapter.title),
        ...createTextParams(chapter.content)
      ],
      headers: {
        default: createHeader(metadata.bookTitle),
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

  // 9. Conclusion
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
        default: createHeader(metadata.bookTitle),
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

  // 10. About the Author
  sections.push({
    properties: {
      page: basePageConfig,
      type: SectionType.ODD_PAGE,
      titlePage: true,
    },
    children: [
      createTitle("Sobre o Autor"),
      ...(content.aboutAuthor ? createTextParams(content.aboutAuthor) : [new Paragraph({
        children: [new TextRun({ text: "[Insira a biografia do autor aqui]", font: "Garamond", size: 27 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 },
        indent: { firstLine: 708 }
      })])
    ],
    headers: {
      default: createHeader(metadata.bookTitle),
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
    evenAndOddHeaders: true,
    sections: sections,
    styles: {
      default: {
        document: {
          run: { font: "Garamond", size: 27 }, // 13.5pt Default
          paragraph: { spacing: { line: 360 } } // 1.5 Lines
        }
      }
    }
  } as any);

  return Packer.toBlob(doc);
};