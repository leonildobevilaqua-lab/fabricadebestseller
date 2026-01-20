import { Request, Response } from 'express';
import * as ConfigService from '../services/config.service';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/email.service';
import { getVal, setVal, reloadDB } from '../services/db.service';
import { v4 as uuidv4 } from 'uuid';

// ... (Login logic)
const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";
const DB_PATH = path.resolve(process.cwd(), 'database.json');

// --- CHANGE PASSWORD (AUTHENTICATED) ---
export const changePassword = async (req: Request, res: Response) => {
    const { oldPass, newPass } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    try {
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jwt.verify(token, SECRET_KEY);
    } catch (e) {
        return res.status(403).json({ error: "Invalid Token" });
    }

    if (!oldPass || !newPass) return res.status(400).json({ error: "Missing fields" });

    try {
        const config = await ConfigService.getConfig();
        const storedPass = config.admin.pass;

        // Verify Old Pass
        let match = false;
        if (storedPass.startsWith('$2b$')) {
            match = await bcrypt.compare(oldPass, storedPass);
        } else {
            match = (storedPass === oldPass);
        }

        if (!match) return res.status(403).json({ error: "Senha atual incorreta" });

        // Hash New Pass
        const hashedPassword = await bcrypt.hash(newPass, 10);

        await ConfigService.updateConfig({
            admin: { ...config.admin, pass: hashedPassword }
        });

        res.json({ success: true });
    } catch (e: any) {
        console.error("Change Pass Error", e);
        res.status(500).json({ error: e.message });
    }
};

// --- FORGOT PASSWORD ---
export const login = async (req: Request, res: Response) => {
    try {
        const { user, pass } = req.body;
        console.log(`[Login Start] Body:`, JSON.stringify(req.body));

        if (!user || !pass) {
            console.error("[Login Error] Missing user or pass");
            return res.status(400).json({ error: "User and Pass are required." });
        }

        // --- HARDCODED "MULTI-USER FAILSAFE" (AUTH V3.0) ---
        // Safe to trim now
        const cleanUser = String(user).trim().toLowerCase();
        const cleanPass = String(pass).trim();

        // --- EMERGENCY CLOUD OVERRIDE (Env Vars) ---
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASS) {
            if (cleanUser === process.env.ADMIN_EMAIL.trim().toLowerCase() && cleanPass === process.env.ADMIN_PASS.trim()) {
                console.log(`[Login] Success via ENV VARS`);
                // @ts-ignore
                const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '2h' });
                return res.json({ token });
            }
        }

        // --- HARDCODED "MULTI-USER FAILSAFE" (AUTH V3.0) ---
        console.log(`[Auth v3.0] Checking User: ${cleanUser}`);

        // User 1: Primary
        if (cleanUser === 'contato@leonildobevilaqua.com.br' && cleanPass === 'Leo129520-*-') {
            console.log(`[Auth v3.0] Success Primary`);
            // @ts-ignore
            const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }

        // User 2: Secondary
        if (cleanUser === 'leonildobevilaqua@gmail.com' && cleanPass === 'Leo129520') {
            console.log(`[Auth v3.0] Success Secondary`);
            // @ts-ignore
            const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }

        /*
        // --- LEGACY CHECK (DB) ---
        // DISABLED FOR DIAGNOSTICS to prevent ConfigService crash
        let isAuthenticated = false;

        // 1. Check Config Service (Legacy & Main)
        const config = await ConfigService.getConfig();
        // ... (rest of logic)

        // Check if config pass is a Hash or Plain
        const storedPass = config.admin.pass;
        if (config.admin.user === user) {
            if (storedPass.startsWith('$2b$')) {
                // It's a hash
                const match = await bcrypt.compare(pass, storedPass);
                if (match) isAuthenticated = true;
            } else {
                // Plain text
                if (storedPass === pass) isAuthenticated = true;
            }
        }

        // 2. Check File Array (Fallback from "Rescue" operation)
        if (!isAuthenticated && fs.existsSync(DB_PATH)) {
            try {
                const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
                if (Array.isArray(dbData)) {
                    const found = dbData.find((u: any) => u.email === user);
                    if (found) {
                        if (await bcrypt.compare(pass, found.password)) isAuthenticated = true;
                    }
                }
            } catch (e) { console.error("Error reading DB file fallback", e); }
        }

        if (isAuthenticated) {
            const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '2h' });
            return res.json({ token });
        }
        */

        res.status(401).json({ error: "Invalid credentials (Auth v3.1 - Safe Mode)" });

    } catch (e) {
        console.error("Login Error", e);
        res.status(500).json({ error: "Internal Error" });
    }
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        const config = await ConfigService.getConfig();
        const exists = config.admin.user === email;

        if (!exists) {
            return res.status(404).json({ error: "Admin email not found" });
        }

        const resetToken = uuidv4();
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');

        await setVal(`/resets/${safeEmail}`, { token: resetToken, expires: Date.now() + 3600000 });

        const origin = req.get('origin') || 'http://localhost:3002';
        const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        const link = `${cleanOrigin}/admin?resetToken=${resetToken}&email=${email}`;

        console.log(`Sending Reset Link to ${email}: ${link}`);

        await sendEmail(
            email,
            "Reset de Senha - Admin",
            `Link para resetar sua senha: ${link}`,
            undefined,
            `<p>Clique <a href="${link}">AQUI</a> para resetar sua senha.</p>`
        );

        res.json({ success: true, message: "Email sent" });

    } catch (e: any) {
        console.error("Forgot Password Error", e);
        res.status(500).json({ error: e.message });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) return res.status(400).json({ error: "Missing fields" });

    try {
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        const stored = await getVal(`/resets/${safeEmail}`);

        if (!stored || stored.token !== token || Date.now() > stored.expires) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const config = await ConfigService.getConfig();

        await ConfigService.updateConfig({
            admin: { ...config.admin, pass: hashedPassword }
        });

        await setVal(`/resets/${safeEmail}`, null);
        res.json({ success: true });

    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const getSettings = async (req: Request, res: Response) => {
    // Normally protect via middleware, simplified here
    const config = await ConfigService.getConfig();
    // Don't reveal password in settings GET
    const safeConfig = { ...config, admin: { ...config.admin, pass: "***" } };
    res.json(safeConfig);
};

export const updateSettings = async (req: Request, res: Response) => {
    const updates = req.body;
    // Prevent password overwrite unless specific flow
    if (updates.admin) delete updates.admin;

    const newConfig = await ConfigService.updateConfig(updates);
    const safeConfig = { ...newConfig, admin: { ...newConfig.admin, pass: "***" } };
    res.json(safeConfig);
};

export const downloadBook = async (req: Request, res: Response) => {
    const { email: identifier } = req.params; // Identifier can be email OR projectId
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');

    // Helper to check UUID
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (isUUID(identifier)) {
        console.log(`Download request by Project ID: ${identifier}`);

        try {
            // Robust Lookup: Find file containing ID in filename (ignoring prefix like email)
            if (fs.existsSync(outputDir)) {
                const files = fs.readdirSync(outputDir);

                // Priority: ZIP then DOCX
                const zipFile = files.find((f: string) => f.includes(identifier) && f.endsWith('.zip'));
                const docFile = files.find((f: string) => f.includes(identifier) && f.endsWith('.docx'));

                if (zipFile) {
                    console.log(`Sending Zip: ${zipFile}`);
                    return res.download(path.join(outputDir, zipFile));
                }
                if (docFile) {
                    console.log(`Sending Doc: ${docFile}`);
                    return res.download(path.join(outputDir, docFile));
                }
            }
        } catch (e) { console.error("Error reading dir", e); }

        console.log(`File not found for Project ID ${identifier}`);
        return res.status(404).json({ error: "File not found for this Project ID" });
    }

    // Fallback: Email-based lookup (Legacy)
    const safeEmail = identifier.replace(/[^a-zA-Z0-9._-]/g, '_');

    // 2. Try Project ID-based names (via Email lookup)
    console.log(`Looking up latest project for email: ${safeEmail}`);
    try {
        const QueueService = require('../services/queue.service');
        const project = await QueueService.getProjectByEmail(identifier);

        if (project) {
            const idZip = path.join(outputDir, `kit_completo_project_${project.id}.zip`);
            const idDoc = path.join(outputDir, `book_project_${project.id}.docx`);

            if (fs.existsSync(idZip)) {
                console.log(`Serving ZIP (ID match from Email): ${idZip}`);
                return res.download(idZip, `kit_completo_${safeEmail}.zip`);
            }
            if (fs.existsSync(idDoc)) {
                console.log(`Serving DOCX (ID match from Email): ${idDoc}`);
                return res.download(idDoc, `book_${safeEmail}.docx`);
            }
        }
    } catch (e) { console.error(e); }

    // 3. Fallback: Try Email-based names (Legacy/Last Resort)
    const emailZip = path.join(outputDir, `kit_completo_${safeEmail}.zip`);
    const emailDoc = path.join(outputDir, `book_${safeEmail}.docx`);

    if (fs.existsSync(emailZip)) {
        console.log(`Serving ZIP (Email match - FALLBACK): ${emailZip}`);
        return res.download(emailZip, `kit_completo_${safeEmail}.zip`);
    }
    if (fs.existsSync(emailDoc)) {
        console.log(`Serving DOCX (Email match - FALLBACK): ${emailDoc}`);
        return res.download(emailDoc, `book_${safeEmail}.docx`);
    }

    console.log(`No files found for ${safeEmail}`);
    res.status(404).json({ error: "Book not found. Try regenerating." });
};

// --- Backups ---
// Imports moved to top

// DB_PATH removed (declared at top)
const BACKUP_DIR = path.resolve(__dirname, '../../backups');

if (!fs.existsSync(BACKUP_DIR)) {
    try { fs.mkdirSync(BACKUP_DIR); } catch (e) { }
}

export const createBackup = async (req: Request, res: Response) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup_${timestamp}.json`;
        const backupPath = path.join(BACKUP_DIR, backupName);

        // Ensure DB is flushed to disk before copy? node-json-db usually saves on push.
        // But we can copy the file.
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, backupPath);
            res.json({ success: true, name: backupName });
        } else {
            res.status(404).json({ error: "Database file not found to backup" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const listBackups = (req: Request, res: Response) => {
    try {
        if (!fs.existsSync(BACKUP_DIR)) return res.json([]);
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
        // Sort by time desc
        const sorted = files.sort((a, b) => {
            const statA = fs.statSync(path.join(BACKUP_DIR, a));
            const statB = fs.statSync(path.join(BACKUP_DIR, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
        });
        res.json(sorted);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}

export const restoreBackup = async (req: Request, res: Response) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: "Filename required" });

        const backupPath = path.join(BACKUP_DIR, filename);
        if (fs.existsSync(backupPath)) {
            // Create a "safety" backup of current state
            const safetyBackup = path.join(BACKUP_DIR, `pre_restore_${new Date().getTime()}.json`);
            if (fs.existsSync(DB_PATH)) fs.copyFileSync(DB_PATH, safetyBackup);

            fs.copyFileSync(backupPath, DB_PATH);

            // Reload DB in memory
            await reloadDB();

            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Backup file not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}

// getVal moved to top

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await getVal('/orders') || [];
        res.json(orders);
    } catch (e: any) {
        console.error("Error getting orders:", e);
        res.json([]);
    }
};
