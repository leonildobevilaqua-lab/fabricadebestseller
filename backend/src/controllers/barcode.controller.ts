
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
      const formattedIsbn = `${fullIsbn13.slice(0,3)}-${fullIsbn13.slice(3,5)}-${fullIsbn13.slice(5,7)}-${fullIsbn13.slice(7,12)}-${fullIsbn13.slice(12)}`;

      // BWIP-JS Options using the native 'isbn' symbology
      const options: any = {
        bcid: 'isbn',
        text: formattedIsbn,
        scale: 5,             // High scale for sharp bars
        height: 25,
        includetext: true,
        backgroundcolor: 'ffffff',
      };

      // Generate the barcode with bwip-js
      const barcodeBuffer = await bwipjs.toBuffer(options);

      // Composite with Canvas to target exactly 591 x 295 px (50mm x 25mm)
      let finalBuffer = barcodeBuffer;
      try {
        const { createCanvas, loadImage } = require('canvas');
        const barcodeImg = await loadImage(barcodeBuffer);
        
        // STRICT SIZE AS REQUESTED
        const TARGET_WIDTH = 591;
        const TARGET_HEIGHT = 295;
        
        const canvas = createCanvas(TARGET_WIDTH, TARGET_HEIGHT);
        const ctx = canvas.getContext('2d');
        
        // Fill white background (Essential for "fundo branco")
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
        
        // Fit keeping aspect ratio but centered
        const scaleX = (TARGET_WIDTH - 60) / barcodeImg.width; // 60px side padding
        const scaleY = (TARGET_HEIGHT - 40) / barcodeImg.height; // 40px top/bottom padding
        const scale = Math.min(scaleX, scaleY);
        
        const drawWidth = barcodeImg.width * scale;
        const drawHeight = barcodeImg.height * scale;
        const drawX = (TARGET_WIDTH - drawWidth) / 2;
        const drawY = (TARGET_HEIGHT - drawHeight) / 2;
        
        ctx.drawImage(barcodeImg, drawX, drawY, drawWidth, drawHeight);
        
        finalBuffer = canvas.toBuffer('image/png');
      } catch (e) {
        console.error("Canvas composition failed for barcode, using raw barcode.", e);
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
      // Sync legacy path too
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
