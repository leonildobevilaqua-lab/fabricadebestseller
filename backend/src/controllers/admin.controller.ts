import { Request, Response } from 'express';
import * as ConfigService from '../services/config.service';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";

export const login = async (req: Request, res: Response) => {
    const { user, pass } = req.body;
    const config = await ConfigService.getConfig();

    if (user === config.admin.user && pass === config.admin.pass) {
        const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({ token });
    }

    res.status(401).json({ error: "Invalid credentials" });
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
import fs from 'fs';
import path from 'path';
import { reloadDB } from '../services/db.service';

const DB_PATH = path.resolve(__dirname, '../../database.json');
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

import { getVal } from '../services/db.service';

export const getOrders = async (req: Request, res: Response) => {
    try {
        const orders = await getVal('/orders') || [];
        res.json(orders);
    } catch (e: any) {
        console.error("Error getting orders:", e);
        res.json([]);
    }
};
