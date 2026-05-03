
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

      // Check Barcode Credits
      await reloadDB();
      let barcodeCredits = Number((await getVal(`/barcodeCredits/${safeEmail}`)) || 0);
      let userObj = await getVal(`/users/${safeEmail}`);
      if (userObj && userObj.barcodeCredits !== undefined) {
        barcodeCredits = Math.max(barcodeCredits, userObj.barcodeCredits);
      }

      const isMaster = safeEmail.includes('leonildo');
      if (!isMaster && barcodeCredits <= 0) {
        return res.status(403).json({ error: "Sem créditos de Código de Barras. Por favor, adquira créditos na Área VIP." });
      }

      const { isbn } = req.body;
      if (!isbn) {
        return res.status(400).json({ error: 'ISBN é obrigatório.' });
      }

      // Clean ISBN: remove dashes and spaces
      let cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Calculate EAN-13 check digit if missing or to ensure it's correct
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
      const fullIsbn13 = digits12 + checkDigit;
      
      // Format ISBN with EXACTLY 17 characters (13 digits + 4 dashes)
      // This is required by bwip-js 'isbn' symbology to avoid 'Bad Length' error
      const formattedIsbn = `${fullIsbn13.slice(0,3)}-${fullIsbn13.slice(3,5)}-${fullIsbn13.slice(5,7)}-${fullIsbn13.slice(7,12)}-${fullIsbn13.slice(12)}`;

      // BWIP-JS Options using the native 'isbn' symbology
      // This symbology is professional and handles top text, bars, and bottom text perfectly.
      const options: any = {
        bcid: 'isbn',         // Professional ISBN symbology
        text: formattedIsbn,  // Must be 17 characters for ISBN-13
        scale: 3,             // High resolution
        height: 25,           // Standard height
        includetext: true,    // Includes both top and bottom text
        backgroundcolor: 'ffffff', // FORCE WHITE BACKGROUND
        paddingwidth: 10,     // Add some margin
        paddingheight: 10,
      };

      // Generate the barcode with bwip-js
      // This is pure JS and doesn't depend on native canvas/cairo
      const finalBuffer = await bwipjs.toBuffer(options);

      const filename = `BARCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      // Decrement credit
      barcodeCredits = Math.max(0, barcodeCredits - 1);
      await setVal(`/barcodeCredits/${safeEmail}`, barcodeCredits);
      if (userObj) {
          await setVal(`/users/${safeEmail}/barcodeCredits`, barcodeCredits);
      }

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
