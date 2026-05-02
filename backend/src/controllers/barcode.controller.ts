
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
      const cleanIsbn = isbn.replace(/[-\s]/g, '');

      // BWIP-JS Options to match requested layout
      // Width: 50mm, Height: 25mm
      // Scale 2-3 usually works best for professional printing
      const options: any = {
        bcid: 'isbn',       // Barcode type
        text: cleanIsbn,    // Text to encode
        scale: 3,           // 3x scaling
        height: 15,         // Bar height, in millimeters (bwip-js height is in mm/units usually depending on config)
        includetext: true,  // Show human-readable text
        textxalign: 'center',
        textsize: 13,       // Font size for the bottom text
      };

      // Generate the barcode
      const pngBuffer = await bwipjs.toBuffer(options);
      
      const filename = `BARCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, pngBuffer);

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
