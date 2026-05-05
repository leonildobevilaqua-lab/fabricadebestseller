
import { Request, Response } from 'express';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import { getVal, setVal, reloadDB } from '../services/db.service';

export const QrController = {
  async generateQr(req: Request, res: Response) {
    try {
      // @ts-ignore
      const email = req.user?.email || req.body.email;
      if (!email) {
        return res.status(401).json({ error: "Email obrigatório para gerar QR Code." });
      }

      const safeEmail = String(email).trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

      // Check QR Credits
      await reloadDB();
      const userObj = await getVal(`/users/${safeEmail}`);
      let qrCredits = Number(await getVal(`/qrCredits/${safeEmail}`) || 0);

      // Fallback to user object if root path is empty
      if (!qrCredits && userObj?.qrCredits) {
        qrCredits = Number(userObj.qrCredits);
      }

      if (qrCredits <= 0) {
        return res.status(403).json({ error: "Sem créditos de QR Code. Por favor, adquira créditos na Área VIP." });
      }

      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL/Link é obrigatório.' });
      }

      // BWIP-JS Options (QR Code)
      const options: any = {
        bcid: 'qrcode',
        text: url,
        scale: 10,            // High resolution
        height: 50,           // Square
        width: 50,
        backgroundcolor: 'ffffff',
        paddingwidth: 2,
        paddingheight: 2
      };

      console.log("[QR Code] Generating for:", url);

      // Generate the QR buffer
      const qrBuffer = await bwipjs.toBuffer(options);

      // We can also add some branding/customization here with Jimp if needed, 
      // but for now, simple clean high-res QR is perfect.
      
      const filename = `QRCODE_${Date.now()}.png`;
      const generatedDir = path.join(__dirname, '../../generated_books');
      if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
      
      const filePath = path.join(generatedDir, filename);
      fs.writeFileSync(filePath, qrBuffer);

      // Decrement credit
      qrCredits = Math.max(0, qrCredits - 1);
      if (userObj) {
          userObj.qrCredits = qrCredits;
          await setVal(`/users/${safeEmail}`, userObj);
      }
      await setVal(`/qrCredits/${safeEmail}`, qrCredits);

      return res.json({
        success: true,
        url: `/downloads/${filename}`,
        downloadUrl: `/downloads/${filename}`,
        filename: filename,
        content: url
      });

    } catch (error: any) {
      console.error("QR Code Generation Error:", error);
      res.status(500).json({ error: error.message || 'Erro ao gerar QR Code.' });
    }
  }
};
