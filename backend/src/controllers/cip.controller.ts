import { Request, Response } from 'express';
import mammoth from 'mammoth';
import AdmZip from 'adm-zip';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { Document, Paragraph, TextRun, Packer, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';
import { SUBJECT_CODES } from '../cip.constants';
import { getVal, setVal, reloadDB } from '../services/db.service';
import Jimp from 'jimp';

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

      // Check CIP Credits - UNIFIED SOURCE OF TRUTH (Matches Admin & Dashboard)
      await reloadDB();
      const userObj = await getVal(`/users/${safeEmail}`);
      let cipCredits = Number(await getVal(`/cipCredits/${safeEmail}`) || 0);
      
      console.log(`[CIP] Credit Check for ${email} (${safeEmail}): Root=${cipCredits} | UserProfile=${userObj?.cipCredits || 0}`);

      // Fallback to user object if root path is empty (Legacy support)
      if (!cipCredits && userObj?.cipCredits) {
        cipCredits = Number(userObj.cipCredits);
      }

      // REMOVED isMaster exemption - Everyone MUST have credits
      console.log(`[CIP] Credit check for ${email}: root=${cipCredits}, userObj=${userObj?.cipCredits || 0}`);
      
      if (cipCredits <= 0) {
        console.warn(`[CIP] User ${email} has no credits. Denying generation. Credits found: ${cipCredits}`);
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: "Sem créditos de Ficha Catalográfica. Por favor, adquira créditos na Área VIP." });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      }

      const { cidade, estado, isbn, pageCount } = req.body;
      if (!cidade || !estado || !isbn) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Cidade, Estado e ISBN são obrigatórios.' });
      }

      // 1. Extract Text First (Always needed for Gemini)
      const result = await mammoth.extractRawText({ path: req.file.path });
      const text = result.value;

      // 2. Determine Page Count
      let exactPages = 0;
      
      // PRIORITIZE MANUAL PAGE COUNT FROM USER
      if (pageCount && !isNaN(parseInt(pageCount))) {
        exactPages = parseInt(pageCount, 10);
        console.log(`[CIP] Using MANUAL Page Count: ${exactPages}`);
      } else {
        // Fallback to automatic detection if not provided manually
        try {
          const zip = new AdmZip(req.file.path);
          const appXml = zip.readAsText("docProps/app.xml");
          if (appXml) {
            const match = appXml.match(/<(?:[^:]+:)?Pages>(\d+)<\/(?:[^:]+:)?Pages>/i);
            if (match && match[1]) {
              exactPages = parseInt(match[1], 10);
              console.log(`[CIP] XML Page Count detected: ${exactPages}`);
            }
          }
        } catch (e) {
          console.log("[CIP] Warning: Could not read app.xml metadata.");
        }

        if (exactPages <= 1) {
          const charCount = text.length;
          exactPages = Math.max(1, Math.ceil(charCount / 1800));
          console.log(`[CIP] Heuristic Page Count fallback: ${exactPages}`);
        }
      }

      // 2. Ask Gemini (SYNCED WITH WORKING VERSION IN LOCALHOST:5173)
      const prompt = `
Você é um bibliotecário especialista em catalogação.
Dado o texto extraído de um livro, determine as seguintes informações:
1. Título do livro
2. Subtítulo (se houver, senão vazio)
3. Nome do autor (ou autora)
4. Assunto principal (nome do assunto principal, sem número)
5. Assuntos secundários (lista com no MÁXIMO 5 palavras-chave. Extraia apenas os 5 principais conceitos como strings limpas, sem número ou pontos no final)
6. Código CDD (escolha o mais adequado da tabela)
7. Código Cutter-Sanborn (OBRIGATÓRIO TER 3 DÍGITOS NUMÉRICOS. Exemplo: para Santos, é 237. Formato: Letra do sobrenome em maiúscula + 3 números da tabela + Letra inicial do título em minúscula. ATENÇÃO: Se a tabela possuir apenas 2 números, você DEVE adicionar um '1' ao final para completar 3 dígitos (ex: B57 -> B571). ATENÇÃO REGRA: Ignore artigos iniciais do título (O, A, Os, As, Um, Uma). Exemplo: para o título "O Último Refúgio", a letra é "u", resultando em "S237u" e não "S237o".)
8. Nome no formato "Sobrenome, Nome."
9. Ano de publicação (use 2026 se não encontrar)

Tabela de Assuntos e CDD disponíveis:
${SUBJECT_CODES}

Texto do livro (amostra inicial):
${text.substring(0, 8000)}
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash", // MATCHING THE WORKING STANDALONE VERSION
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

      let aiData: any;
      try {
        const completion = await model.generateContent(prompt);
        const responseText = completion.response.text();
        console.log("[CIP] Raw AI Response (Synced):", responseText);
        aiData = JSON.parse(responseText);
        
        // FIX CUTTER-SANBORN 3-DIGIT REQUIREMENT
        if (aiData.cutter) {
            const cutterMatch = aiData.cutter.match(/^([A-Z])(\d{2})([a-z])$/);
            if (cutterMatch) {
                aiData.cutter = `${cutterMatch[1]}${cutterMatch[2]}1${cutterMatch[3]}`;
            }
        }
      } catch (aiErr: any) {
        console.error("[CIP] AI Analysis Failure (Synced):", aiErr);
        throw new Error(`Falha na análise do documento (Erro na IA: ${aiErr.message})`);
      }
      aiData.pages = exactPages;

      const formattedCidade = cidade.trim();
      const formattedEstado = getEstadoSigla(estado);
      const formattedISBN = isbn.trim();

      if (!aiData || !aiData.title || !aiData.mainSubject) {
        console.error("[CIP] Gemini returned valid JSON but missing mandatory fields:", aiData);
        throw new Error("Falha na análise do documento (Dados incompletos retornados pela IA).");
      }

      console.log("[CIP] AI Analysis successful for:", aiData.title);

      const limitedKeywords = (aiData.keywords || []).slice(0, 4);
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
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const docxPath = path.join(generatedDir, docxFilename);
      fs.writeFileSync(docxPath, docxBuffer);

      // Decrement credit
      cipCredits = Math.max(0, cipCredits - 1);
      if (userObj) {
          userObj.cipCredits = cipCredits;
          await setVal(`/users/${safeEmail}`, userObj);
      }
      await setVal(`/cipCredits/${safeEmail}`, cipCredits);

      res.json({
        success: true,
        data: aiData,
        files: {
          docx: `/downloads/${docxFilename}`,
          png: null // PNG generation disabled as per user request
        }
      });

      if (req.file) fs.unlinkSync(req.file.path);

    } catch (error: any) {
      console.error("CIP Generation Error:", error);
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      const detail = error.message || "";
      res.status(500).json({ 
        error: `Erro ao gerar ficha catalográfica: ${detail.includes('quota') ? 'Limite de uso da IA excedido.' : 'Falha na análise do documento.'}`,
        details: detail
      });
    }
  }
};
