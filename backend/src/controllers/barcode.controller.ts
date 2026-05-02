
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
      const options: any = {
        bcid: 'ean13',      // Use ean13 for ISBN-13 barcodes
        text: cleanIsbn,    // Text to encode
        scale: 3,           // 3x scaling
        height: 15,         // Bar height, in millimeters (bwip-js height is in mm/units usually depending on config)
        includetext: true,  // Show human-readable text
        textxalign: 'center',
        textsize: 13,       // Font size for the bottom text
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
      
      // Format ISBN for the top text (e.g., ISBN 978-65-00-00000-0)
      // If user provided dashes, try to preserve some of them or just use a standard format
      const formattedIsbnTop = `ISBN ${fullIsbn13.slice(0,3)}-${fullIsbn13.slice(3,5)}-${fullIsbn13.slice(5,10)}-${fullIsbn13.slice(10,12)}-${fullIsbn13.slice(12)}`;

      // Composite with Canvas
      let finalBuffer = barcodeBuffer;
      try {
        const { createCanvas, loadImage } = require('canvas');
        const barcodeImg = await loadImage(barcodeBuffer);
        
        // Create a slightly larger canvas to accommodate the top text
        // Adding 40px padding at the top for the ISBN text
        const canvas = createCanvas(barcodeImg.width, barcodeImg.height + 60);
        const ctx = canvas.getContext('2d');
        
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the ISBN text at the top
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 30px "Helvetica", "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formattedIsbnTop, canvas.width / 2, 40);
        
        // Draw the barcode image below the text
        ctx.drawImage(barcodeImg, 0, 50);
        
        finalBuffer = canvas.toBuffer('image/png');
      } catch (e) {
        console.error("Canvas composition failed for barcode, using raw barcode.", e);
        // Fallback to raw barcode if canvas fails
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
