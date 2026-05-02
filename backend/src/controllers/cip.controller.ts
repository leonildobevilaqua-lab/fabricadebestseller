import { Request, Response } from 'express';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Document, Paragraph, TextRun, Packer, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { SUBJECT_CODES } from '../cip.constants';
import { getVal, setVal, reloadDB } from '../services/db.service';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const getEstadoSigla = (estado: string) => {
  const ufMap: { [key: string]: string } = {
    'acre': 'AC', 'alagoas': 'AL', 'amapa': 'AP', 'amapá': 'AP', 'amazonas': 'AM',
    'bahia': 'BA', 'ceara': 'CE', 'ceará': 'CE', 'distrito federal': 'DF',
    'espirito santo': 'ES', 'espírito santo': 'ES', 'goias': 'GO', 'goiás': 'GO',
    'maranhao': 'MA', 'maranhão': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
    'minas gerais': 'MG', 'para': 'PA', 'pará': 'PA', 'paraiba': 'PB', 'paraíba': 'PB',
    'parana': 'PR', 'paraná': 'PR', 'pernambuco': 'PE', 'piaui': 'PI', 'piauí': 'PI',
    'rio de janeiro': 'RJ', 'rio grande do norte': 'RN', 'rio grande do sul': 'RS',
    'rondonia': 'RO', 'rondônia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
    'sao paulo': 'SP', 'são paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
  };
  const eStr = estado.trim().toLowerCase();
  return ufMap[eStr] || estado.trim().toUpperCase();
};

export const CipController = {
  async generateCip(req: Request, res: Response) {
    try {
      // @ts-ignore
      const email = req.user?.email || req.body.email;
      if (!email) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(401).json({ error: "Email obrigatório para gerar CIP." });
      }

      const safeEmail = String(email).trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

      // Check CIP Credits
      await reloadDB();
      let cipCredits = Number((await getVal(`/cipCredits/${safeEmail}`)) || 0);
      let userObj = await getVal(`/users/${safeEmail}`);
      if (userObj && userObj.cipCredits !== undefined) {
        cipCredits = Math.max(cipCredits, userObj.cipCredits);
      }

      const isMaster = safeEmail.includes('leonildo');
      if (!isMaster && cipCredits <= 0) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "Sem créditos de Ficha Catalográfica." });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const { cidade, estado, isbn } = req.body;
      if (!cidade || !estado || !isbn) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Cidade, Estado e ISBN são obrigatórios.' });
      }

      // Decrement credit immediately
      if (!isMaster) {
        cipCredits -= 1;
        await setVal(`/cipCredits/${safeEmail}`, cipCredits);
        if (userObj) {
            await setVal(`/users/${safeEmail}/cipCredits`, cipCredits);
        }
      }

      // 1. Get Exact Page Count from DOCX XML
      let exactPages = 0;
      try {
        const zip = new AdmZip(req.file.path);
        const appXml = zip.readAsText("docProps/app.xml");
        if (appXml) {
          const match = appXml.match(/<(?:[^:]+:)?Pages>(\d+)<\/(?:[^:]+:)?Pages>/i);
          if (match && match[1]) {
            exactPages = parseInt(match[1], 10);
          }
        }
      } catch (e) {
        console.log("Aviso: Não foi possível ler as páginas exatas via XML.");
      }

      // Extract text
      const result = await mammoth.extractRawText({ path: req.file.path });
      const text = result.value;

      if (exactPages === 0) {
        const wordCount = text.split(/\s+/).length;
        exactPages = Math.max(1, Math.ceil(wordCount / 250));
      }

      // 2. Ask Gemini
      const prompt = `
Você é um bibliotecário especialista em catalogação.
Dado o texto extraído de um livro, determine as seguintes informações:
1. Título do livro
2. Subtítulo (se houver, senão vazio)
3. Nome do autor (ou autora)
4. Assunto principal (nome do assunto principal, sem número)
5. Assuntos secundários (lista com no MÁXIMO 5 palavras-chave. Extraia apenas os 5 principais conceitos como strings limpas, sem número ou pontos no final)
6. Código CDD (escolha o mais adequado da tabela)
7. Código Cutter-Sanborn (Utilize a tabela Cutter-Sanborn de 3 dígitos exatos. Exemplo: para Santos, é 237. Formato: Letra do sobrenome em maiúscula + 3 números da tabela + Letra inicial do título em minúscula. ATENÇÃO REGRA: Ignore artigos iniciais do título (O, A, Os, As, Um, Uma). Exemplo: para o título "O Último Refúgio", a letra é "u", resultando em "S237u" e não "S237o".)
8. Nome no formato "Sobrenome, Nome."
9. Ano de publicação (use 2026 se não encontrar)

Tabela de Assuntos e CDD disponíveis:
${SUBJECT_CODES}

Texto do livro (amostra inicial):
${text.substring(0, 8000)}
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              subtitle: { type: SchemaType.STRING },
              author: { type: SchemaType.STRING },
              authorFormatted: { type: SchemaType.STRING },
              cutter: { type: SchemaType.STRING },
              cdd: { type: SchemaType.STRING },
              mainSubject: { type: SchemaType.STRING },
              keywords: { 
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              year: { type: SchemaType.STRING }
            },
            required: ["title", "subtitle", "author", "authorFormatted", "cutter", "cdd", "mainSubject", "keywords", "year"]
          }
        }
      });

      const completion = await model.generateContent(prompt);
      const responseText = completion.response.text();
      const aiData = JSON.parse(responseText);
      aiData.pages = exactPages;

      const formattedCidade = cidade.trim();
      const formattedEstado = getEstadoSigla(estado);
      const formattedISBN = isbn.trim();

      const limitedKeywords = aiData.keywords.slice(0, 5);
      const formattedKeywordsList = limitedKeywords.map((kw: string, i: number) => `${i + 1}. ${kw.replace(/\.$/, '')}`);
      const keywordsText = formattedKeywordsList.join(". ") + `. I. Título. II. ${aiData.mainSubject.replace(/\.$/, '')}.`;

      // 3. Generate Word Document (.docx)
      const doc = new Document({
        sections: [{
          properties: {
            page: { margin: { top: 1417, right: 1701, bottom: 1417, left: 1701 } }
          },
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      margins: { top: 200, bottom: 200, left: 200, right: 200 },
                      children: [
                        new Paragraph({ children: [new TextRun({ text: "Dados Internacionais de Catalogação na Publicação (CIP)", size: 28, bold: true })], alignment: AlignmentType.CENTER }),
                        new Paragraph({ children: [new TextRun({ text: "(Ficha Catalográfica Elaborada pela Editora 360 Express)", size: 28, bold: true, italics: true })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                        new Paragraph({ border: { top: { color: "000000", space: 1, style: BorderStyle.THICK, size: 12 } }, text: "" }),
                        new Paragraph({ children: [new TextRun({ text: aiData.cutter, size: 28 })], indent: { left: 850 }, spacing: { before: 200 } }),
                        new Paragraph({ children: [new TextRun({ text: aiData.authorFormatted, bold: true, size: 28 })], alignment: AlignmentType.LEFT, spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `${aiData.title}${aiData.subtitle ? ': ' + aiData.subtitle : ''} / ${aiData.author}. – 1ª edição – ${formattedCidade}, ${formattedEstado}: Editora 360 Express, ${aiData.year}.`, size: 28 })], indent: { left: 850 }, alignment: AlignmentType.LEFT, spacing: { after: 100 } }),
                        new Paragraph({ children: [new TextRun({ text: `${aiData.pages} p.; 15,2 x 22,8 cm`, size: 28 })], alignment: AlignmentType.LEFT, spacing: { after: 400 } }),
                        new Paragraph({ children: [new TextRun({ text: `ISBN ${formattedISBN}`, bold: true, size: 52 })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
                        new Paragraph({ children: [new TextRun({ text: keywordsText, size: 28 })], alignment: AlignmentType.LEFT, spacing: { after: 200 } }),
                        new Paragraph({ border: { bottom: { color: "000000", space: 1, style: BorderStyle.THICK, size: 12 } }, text: "" }),
                        new Paragraph({ children: [new TextRun({ text: `CDD: ${aiData.cdd}`, bold: true, size: 36 })], alignment: AlignmentType.RIGHT, spacing: { before: 100 } }),
                      ]
                    })
                  ]
                })
              ]
            })
          ],
        }],
      });

      const docxBuffer = await Packer.toBuffer(doc);
      const docxFilename = `CIP_${Date.now()}.docx`;
      const docxPath = path.join(__dirname, '../../generated_books', docxFilename);
      fs.writeFileSync(docxPath, docxBuffer);

      // 4. Generate Image (.png)
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 600);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 760, 560);
      
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px "Times New Roman", serif';
      ctx.fillText("Dados Internacionais de Catalogação na Publicação (CIP)", 400, 60);
      ctx.font = 'bold italic 20px "Times New Roman", serif';
      ctx.fillText("(Ficha Catalográfica Elaborada pela Editora 360 Express)", 400, 90);
      
      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.moveTo(40, 110);
      ctx.lineTo(760, 110);
      ctx.stroke();
      
      ctx.textAlign = 'left';
      ctx.font = '20px "Times New Roman", serif';
      ctx.fillText(aiData.cutter, 90, 150);
      ctx.font = 'bold 20px "Times New Roman", serif';
      ctx.fillText(aiData.authorFormatted, 40, 180);
      
      ctx.font = '20px "Times New Roman", serif';
      const descText = `${aiData.title}${aiData.subtitle ? ': ' + aiData.subtitle : ''} / ${aiData.author}. – 1ª edição – ${formattedCidade}, ${formattedEstado}: Editora 360 Express, ${aiData.year}.`;
      
      const wrapText = (context: any, text: string, x: number, y: number, rightMargin: number, lineHeight: number, indentFirstLine: boolean = false) => {
        const words = text.split(' ');
        let line = '';
        let currentX = indentFirstLine ? x + 50 : x;
        for(let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          if (currentX + metrics.width > rightMargin && n > 0) {
            context.fillText(line, currentX, y);
            line = words[n] + ' ';
            y += lineHeight;
            currentX = x;
          } else {
            line = testLine;
          }
        }
        context.fillText(line, currentX, y);
        return y;
      };

      let nextY = wrapText(ctx, descText, 40, 210, 750, 26, true);
      ctx.fillText(`${aiData.pages} p.; 15,2 x 22,8 cm`, 40, nextY + 30);
      
      ctx.textAlign = 'center';
      ctx.font = 'bold 36px "Times New Roman", serif';
      ctx.fillText(`ISBN ${formattedISBN}`, 400, nextY + 110);
      
      ctx.textAlign = 'left';
      ctx.font = '20px "Times New Roman", serif';
      nextY = wrapText(ctx, keywordsText, 40, nextY + 170, 750, 26, false);

      ctx.beginPath();
      ctx.lineWidth = 4;
      ctx.moveTo(40, 520);
      ctx.lineTo(760, 520);
      ctx.stroke();
      
      ctx.textAlign = 'right';
      ctx.font = 'bold 26px "Times New Roman", serif';
      ctx.fillText(`CDD: ${aiData.cdd}`, 760, 550);

      const pngBuffer = canvas.toBuffer('image/png');
      const pngFilename = `CIP_${Date.now()}.png`;
      const pngPath = path.join(__dirname, '../../generated_books', pngFilename);
      fs.writeFileSync(pngPath, pngBuffer);

      res.json({
        success: true,
        data: aiData,
        files: {
          docx: `/downloads/${docxFilename}`,
          png: `/downloads/${pngFilename}`
        }
      });

      fs.unlinkSync(req.file.path);

    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao gerar ficha catalográfica.' });
    }
  }
};
