
import { Request, Response } from 'express';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import { getVal, setVal, reloadDB } from '../services/db.service';

export const BarcodeController = {
  async generateBarcode(req: Request, res: Response) {
    try {
      // @ts-ignore
      const email = req.user?.email || req.body.email;
      if (!email) {
        return res.status(401).json({ error: "Email obrigatório para gerar Código de Barras." });
      }

      const safeEmail = String(email).trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

      // Check Barcode Credits - UNIFIED SOURCE OF TRUTH (Matches Admin & Dashboard)
      await reloadDB();
      const userObj = await getVal(`/users/${safeEmail}`);
      let barcodeCredits = Number(await getVal(`/barcodeCredits/${safeEmail}`) || 0);

      // Fallback to user object if root path is empty (Legacy support)
      if (!barcodeCredits && userObj?.barcodeCredits) {
        barcodeCredits = Number(userObj.barcodeCredits);
      }

      if (barcodeCredits <= 0) {
        return res.status(403).json({ error: "Sem créditos de Código de Barras. Por favor, adquira créditos na Área VIP." });
      }

      const { isbn } = req.body;
      if (!isbn) {
        return res.status(400).json({ error: 'ISBN é obrigatório.' });
      }

      // Clean ISBN: remove dashes and spaces
      let cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Ensure we have 13 digits for EAN-13/ISBN-13
      if (cleanIsbn.length < 12) {
        return res.status(400).json({ error: 'O código deve ter pelo menos 12 ou 13 dígitos.' });
      }

      // Calculate EAN-13 check digit if we have 12 or to verify 13
      const calculateEan13CheckDigit = (digits12: string) => {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit.toString();
      };

      const digits12 = cleanIsbn.substring(0, 12);
      const checkDigit = calculateEan13CheckDigit(digits12);
      const fullCode = digits12 + checkDigit;
      
      // Format for top text (Professional ISBN format)
      // Even if not a real ISBN prefix, we keep the requested format for the user
      const formattedTop = `ISBN ${fullCode.slice(0,3)}-${fullCode.slice(3,5)}-${fullCode.slice(5,7)}-${fullCode.slice(7,12)}-${fullCode.slice(12)}`;

      // BWIP-JS Options (EAN-13) - 100% FIDELITY TO REFERENCE
      const options: any = {
        bcid: 'ean13',
        text: fullCode,
        scale: 5,             // Optimal resolution for 590px
        height: 25,           // Standard bar height
        includetext: true,    
        backgroundcolor: 'ffffff',
        textsize: 11,         // Professional font size
        textyoffset: 2,       // CLEAN GAP BETWEEN BARS AND NUMBERS
        guardwhitespace: true, // ENSURES LEADING "9" IS OUTSIDE ON THE LEFT
        inkdetect: false
      };

      console.log("[Barcode] Generating 100% Match EAN-13 for:", fullCode);

      // Generate the barcode buffer
      const barcodeBuffer = await bwipjs.toBuffer(options);

      // PURE JS PROCESSING WITH JIMP
      let finalBuffer = barcodeBuffer;
      try {
        const Jimp = require('jimp');
        const barcodeImage = await Jimp.read(barcodeBuffer);
        
        // 1. EXACT SIZE: 590 x 295 PX
        const canvas = new Jimp(590, 295, 0xFFFFFFFF);
        
        // 2. POSITION BARCODE (Giving enough space for top and bottom)
        const bx = (canvas.bitmap.width - barcodeImage.bitmap.width) / 2;
        const by = 55; // Perfect vertical balance
        canvas.composite(barcodeImage, bx, by);
        
        // 3. ADD ISBN TEXT AT TOP (Centered)
        try {
          const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
          const textToPrint = `ISBN: ${formattedTop.replace('ISBN ', '')}`;
          const textWidth = Jimp.measureText(font, textToPrint);
          const tx = (canvas.bitmap.width - textWidth) / 2;
          canvas.print(font, tx, 15, textToPrint);
        } catch (fontErr) {
          console.error("Font loading failed:", fontErr);
        }
        
        finalBuffer = await canvas.getBufferAsync(Jimp.MIME_PNG);
      } catch (e) {
        console.error("Jimp processing failed:", e);
      }

      const filename = `BARCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      // Decrement credit
      barcodeCredits = Math.max(0, barcodeCredits - 1);
      if (userObj) {
          userObj.barcodeCredits = barcodeCredits;
          await setVal(`/users/${safeEmail}`, userObj);
      }
      await setVal(`/barcodeCredits/${safeEmail}`, barcodeCredits);

      return res.json({
        success: true,
        url: `/downloads/${filename}`,
        downloadUrl: `/downloads/${filename}`,
        filename: filename,
        isbn: cleanIsbn
      });

    } catch (error: any) {
      console.error("Barcode Generation Error:", error);
      res.status(500).json({ error: error.message || 'Erro ao gerar código de barras.' });
    }
  }
};
