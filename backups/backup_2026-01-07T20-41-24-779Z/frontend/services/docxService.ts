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
  NumberFormat
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

  // --- Helper Functions ---

  const createHeader = (text: string) => {
    return new Header({
      children: [
        new Paragraph({
          children: [new TextRun({ text, font: "Garamond", size: 24 })], // 12pt Header
          alignment: AlignmentType.CENTER,
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
        spacing: { after: 200, line: 360 },
        indent: { firstLine: 709 },
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
        children: [new TextRun({ text: `Capítulo ${num}`, bold: true, font: "Garamond", size: 36 })], // Slightly smaller "Capítulo X"
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400, after: 400 },
        pageBreakBefore: false
      }),
      new Paragraph({
        children: [new TextRun({ text: cleanTitle, bold: true, font: "Garamond", size: 48 })],
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

  // --- FRONT MATTER ---

  // 1. Half Title (Página 1 - Direita/Ímpar)
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
        children: [new TextRun({ text: metadata.subTitle, italics: true, font: "Garamond", size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 2. Title Page (Página 3 - Direita/Ímpar)
  sections.push({
    properties: {
      type: SectionType.ODD_PAGE || 'oddPage',
      page: basePageConfig,
    },
    children: [
      new Paragraph({
        children: [new TextRun({ text: metadata.authorName, font: "Garamond", bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 720 },
      }),
      new Paragraph({
        children: [new TextRun({ text: metadata.bookTitle, bold: true, font: "Garamond", size: 52 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 3000 },
      }),
      new Paragraph({
        children: [new TextRun({ text: metadata.subTitle, font: "Garamond", size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Editora 360 Express", bold: true, font: "Garamond", size: 32, color: "000000" })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 4000 },
      }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 3. Catalog Card (Página 4 - Esquerda/Par)
  sections.push({
    properties: { type: SectionType.EVEN_PAGE || 'evenPage', page: basePageConfig },
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: "Dados Internacionais de Catalogação na Publicação (CIP)", font: "Arial", size: 16, bold: true }),
          new TextRun({ text: "\n(Ficha Catalográfica Elaborada pela Editora 360 Express)", font: "Arial", size: 16, italics: true }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 8000 },
      }),
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, space: 10, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 6, space: 10, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 6, space: 10, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 6, space: 10, color: "000000" },
        },
        children: [
          new TextRun({ text: `  ${metadata.authorName}`, font: "Arial", size: 18, bold: true }),
          new TextRun({ text: `\n\n      ${metadata.bookTitle}: ${metadata.subTitle} / ${metadata.authorName}. – 1. ed. – São Paulo : Editora 360 Express, ${new Date().getFullYear()}.`, font: "Arial", size: 18 }),
          new TextRun({ text: "\n\n      160 p.; 15,2 x 22,8 cm", font: "Arial", size: 18 }),
          new TextRun({ text: "\n\n      ISBN 978-65-01-XX-XXX-X", font: "Arial", size: 20, bold: true }),
          new TextRun({ text: `\n\n      1. ${metadata.topic} 2. Desenvolvimento Pessoal. I. Título.`, font: "Arial", size: 18 }),
        ],
        spacing: { before: 200, after: 200 },
        indent: { left: 720, right: 720 },
        alignment: AlignmentType.LEFT
      }),
      new Paragraph({
        text: `CDD: 158.1`,
        alignment: AlignmentType.RIGHT,
        spacing: { before: 100 },
        style: "DefaultParagraphFont"
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "\nÍndice para catálogo sistemático:\n1. Tópico principal : " + metadata.topic, font: "Arial", size: 16 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
      })
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 4. Acknowledgments
  if (content.acknowledgments) {
    sections.push({
      properties: { type: SectionType.ODD_PAGE || 'oddPage', page: basePageConfig },
      children: [
        createTitle("AGRADECIMENTO"),
        ...createTextParams(content.acknowledgments)
      ],
      headers: { default: new Header({ children: [] }) },
      footers: { default: new Footer({ children: [] }) },
    });
  }

  // 5. Dedication
  // "Escreva a Dedicatória no mesmo padrão de formatação da página de agradecimento" -> Justify Text
  if (content.dedication) {
    sections.push({
      properties: { type: SectionType.ODD_PAGE || 'oddPage', page: basePageConfig },
      children: [
        createTitle("DEDICATÓRIA"),
        new Paragraph({
          children: [new TextRun({ text: content.dedication, italics: true, font: "Garamond", size: 27 })], // 13.5pt matching body
          alignment: AlignmentType.JUSTIFIED, // SAME AS ACKNOWLEDGMENT
          indent: { firstLine: 709 },
          spacing: { before: 2000, line: 360 },
        })
      ],
      headers: { default: new Header({ children: [] }) },
      footers: { default: new Footer({ children: [] }) },
    });
  }

  // 6. Table of Contents
  // "Crie uma forma de criar um Sumário onde já tenha de forma pré definida os textos dos capítulos. Exemplo: Capítulo 1"
  // "Pode ser deixada em Branco (SOBRE O AUTOR), mas deve compor o sumário"
  sections.push({
    properties: { type: SectionType.ODD_PAGE || 'oddPage', page: basePageConfig },
    children: [
      createTitle("Sumário"),
      new Paragraph({ children: [new TextRun({ text: "Introdução .......................................................................................... 11", font: "Garamond", size: 24 })], spacing: { after: 200 }, alignment: AlignmentType.JUSTIFIED }),
      ...content.chapters.map((c, i) => new Paragraph({
        children: [new TextRun({ text: `Capítulo ${i + 1}: ${c.title} .......................................................................................... ${14 + (i * 3)}`, font: "Garamond", size: 24 })],
        spacing: { after: 200 },
        alignment: AlignmentType.JUSTIFIED
      })),
      new Paragraph({ children: [new TextRun({ text: "Conclusão .......................................................................................... " + (14 + (content.chapters.length * 3) + 2), font: "Garamond", size: 24 })], spacing: { after: 200 }, alignment: AlignmentType.JUSTIFIED }),
      new Paragraph({ children: [new TextRun({ text: "Sobre o Autor .......................................................................................... " + (14 + (content.chapters.length * 3) + 4), font: "Garamond", size: 24 })], spacing: { after: 200 }, alignment: AlignmentType.JUSTIFIED }),
    ],
    headers: { default: new Header({ children: [] }) },
    footers: { default: new Footer({ children: [] }) },
  });

  // 7. Introduction
  sections.push({
    properties: {
      page: { ...basePageConfig, pageNumbers: { formatType: NumberFormat.DECIMAL } },
      type: SectionType.ODD_PAGE || 'oddPage',
      titlePage: true,
    },
    children: [
      createTitle("Introdução"),
      ...createTextParams(content.introduction)
    ],
    headers: {
      default: createHeader(metadata.bookTitle),  // ODD -> Title
      even: createHeader(metadata.authorName),    // EVEN -> Author
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
        type: SectionType.ODD_PAGE || 'oddPage',
        titlePage: true,
      },
      children: [
        // "Capítulo 1 ... xxxx"
        ...createChapterNumberTitle(index + 1, chapter.title),
        ...createTextParams(chapter.content)
      ],
      headers: {
        default: createHeader(metadata.bookTitle), // ODD -> Title (Right Page)
        even: createHeader(metadata.authorName),   // EVEN -> Author (Left Page)
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
        type: SectionType.ODD_PAGE || 'oddPage',
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
      type: SectionType.ODD_PAGE || 'oddPage',
      titlePage: true,
    },
    children: [
      createTitle("Sobre o Autor"),
      new Paragraph({
        children: [new TextRun({ text: "[Insira a biografia do autor aqui]", font: "Garamond", size: 27 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360 },
        indent: { firstLine: 709 }
      })
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