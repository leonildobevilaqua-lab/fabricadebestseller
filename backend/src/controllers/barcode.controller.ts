
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

      // Check Barcode Credits - Unify source of truth
      await reloadDB();
      const userObj = await getVal(`/users/${safeEmail}`);
      let barcodeCredits = Number(userObj?.barcodeCredits || 0);

      // REMOVED isMaster exemption - Everyone MUST have credits to test or generate
      if (barcodeCredits <= 0) {
        return res.status(403).json({ error: "Sem créditos de Código de Barras. Por favor, adquira créditos na Área VIP." });
      }

      const { isbn } = req.body;
      if (!isbn) {
        return res.status(400).json({ error: 'ISBN é obrigatório.' });
      }

      // Clean ISBN: remove dashes and spaces
      let cleanIsbn = isbn.replace(/[-\s]/g, '');
      
      // Calculate EAN-13 check digit
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
      
      // Format ISBN for top text
      const formattedIsbn = `${fullIsbn13.slice(0,3)}-${fullIsbn13.slice(3,5)}-${fullIsbn13.slice(5,7)}-${fullIsbn13.slice(7,12)}-${fullIsbn13.slice(12)}`;

      // BWIP-JS Options
      const options: any = {
        bcid: 'isbn',
        text: formattedIsbn,
        scale: 4,             
        height: 25,
        includetext: true,
        backgroundcolor: 'ffffff',
      };

      // Generate the barcode buffer
      const barcodeBuffer = await bwipjs.toBuffer(options);

      // PURE JS PROCESSING WITH JIMP (No native dependencies)
      let finalBuffer = barcodeBuffer;
      try {
        const Jimp = require('jimp');
        const barcodeImage = await Jimp.read(barcodeBuffer);
        
        // TARGET: 591 x 295
        const background = new Jimp(591, 295, 0xFFFFFFFF); // Solid White
        
        // Center the barcode inside the target frame with some padding
        barcodeImage.scaleToFit(531, 265); 
        
        const x = Math.round((591 - barcodeImage.bitmap.width) / 2);
        const y = Math.round((295 - barcodeImage.bitmap.height) / 2);
        
        background.composite(barcodeImage, x, y);
        
        finalBuffer = await background.getBufferAsync(Jimp.MIME_PNG);
      } catch (e) {
        console.error("Jimp processing failed:", e);
      }

      const filename = `BARCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      // Decrement credit - Unify source of truth
      barcodeCredits = Math.max(0, barcodeCredits - 1);
      if (userObj) {
          await setVal(`/users/${safeEmail}/barcodeCredits`, barcodeCredits);
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
