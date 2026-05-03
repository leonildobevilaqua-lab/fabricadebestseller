
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
      
      // If 13 digits, take first 12 to let bwip-js calculate the correct check digit
      if (cleanIsbn.length === 13) {
        cleanIsbn = cleanIsbn.substring(0, 12);
      }

      // BWIP-JS Options to match requested layout
      // Using 'ean13' for reliable generation without strict dash validation
      const options: any = {
        bcid: 'ean13',      // Standard EAN-13 (used for ISBN-13)
        text: cleanIsbn,    // First 12 digits
        scale: 3,           // 3x scaling for high resolution
        height: 30,         // Taller bars (30mm)
        includetext: true,  // Bottom numerals in standard EAN-13 layout
        textxalign: 'center',
        textsize: 10,       // Standard size for bottom text
      };

      // Generate the barcode with bwip-js
      const barcodeBuffer = await bwipjs.toBuffer(options);

      // Helper to calculate EAN-13 check digit
      const calculateEan13CheckDigit = (digits12: string) => {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += parseInt(digits12[i]) * (i % 2 === 0 ? 1 : 3);
        }
        const checkDigit = (10 - (sum % 10)) % 10;
        return checkDigit.toString();
      };

      const fullIsbn13 = cleanIsbn + calculateEan13CheckDigit(cleanIsbn);
      
      // Format ISBN for the top text (e.g., ISBN: 978-65-02-07968-3)
      const formattedIsbnTop = `ISBN: ${fullIsbn13.slice(0,3)}-${fullIsbn13.slice(3,5)}-${fullIsbn13.slice(5,7)}-${fullIsbn13.slice(7,12)}-${fullIsbn13.slice(12)}`;

      // Composite with Canvas to add the top ISBN text
      let finalBuffer = barcodeBuffer;
      try {
        const { createCanvas, loadImage } = require('canvas');
        const barcodeImg = await loadImage(barcodeBuffer);
        
        // Create canvas with extra 70px top padding
        const canvas = createCanvas(barcodeImg.width, barcodeImg.height + 70);
        const ctx = canvas.getContext('2d');
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the ISBN text at the top
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formattedIsbnTop, canvas.width / 2, 45);
        
        // Draw the barcode image below the text (70px offset)
        ctx.drawImage(barcodeImg, 0, 70);
        
        finalBuffer = canvas.toBuffer('image/png');
      } catch (e) {
        console.error("Canvas composition failed for barcode, using raw barcode.", e);
      }

      const filename = `BARCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, finalBuffer);

      // Decrement credit if not master
      if (!isMaster) {
        barcodeCredits -= 1;
        await setVal(`/barcodeCredits/${safeEmail}`, barcodeCredits);
        if (userObj) {
            await setVal(`/users/${safeEmail}/barcodeCredits`, barcodeCredits);
        }
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
