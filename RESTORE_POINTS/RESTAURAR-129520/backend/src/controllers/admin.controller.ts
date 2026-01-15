import { Request, Response } from 'express';
import * as ConfigService from '../services/config.service';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "SUPER_SECRET_ADMIN_KEY_CHANGE_ME"; // In prod usage env

export const login = (req: Request, res: Response) => {
    const { user, pass } = req.body;
    const config = ConfigService.getConfig();

    if (user === config.admin.user && pass === config.admin.pass) {
        const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({ token });
    }

    res.status(401).json({ error: "Invalid credentials" });
};

export const getSettings = (req: Request, res: Response) => {
    // Normally protect via middleware, simplified here
    const config = ConfigService.getConfig();
    // Don't reveal password in settings GET
    const safeConfig = { ...config, admin: { ...config.admin, pass: "***" } };
    res.json(safeConfig);
};

export const updateSettings = (req: Request, res: Response) => {
    const updates = req.body;
    // Prevent password overwrite unless specific flow
    if (updates.admin) delete updates.admin;

    const newConfig = ConfigService.updateConfig(updates);
    const safeConfig = { ...newConfig, admin: { ...newConfig.admin, pass: "***" } };
    res.json(safeConfig);
};

export const downloadBook = async (req: Request, res: Response) => {
    const { email } = req.params;
    // Strict replacement of special chars including @
    const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fs = require('fs');
    const path = require('path');

    const outputDir = path.join(__dirname, '../../generated_books');

    // 0. Remove Legacy Email-based lookup priority to avoid serving stale files
    // The previous logic checked for `kit_completo_{email}.zip` first, which caused
    // the system to serve an old book if the user created a new one with the same email.

    // We will now Fallback to email-based lookup ONLY if ID-based lookup fails.

    // 2. Try Project ID-based names
    console.log(`Files not found by email ${safeEmail}, looking up latest project ID...`);
    try {
        // Dynamic require to avoid top-level import issues in this urgent patch
        const QueueService = require('../services/queue.service');
        const project = await QueueService.getProjectByEmail(email);
        if (project) {
            const idZip = path.join(outputDir, `kit_completo_project_${project.id}.zip`);
            const idDoc = path.join(outputDir, `book_project_${project.id}.docx`);

            if (fs.existsSync(idZip)) {
                console.log(`Serving ZIP (ID match): ${idZip}`);
                return res.download(idZip, `kit_completo_${safeEmail}.zip`);
            }
            if (fs.existsSync(idDoc)) {
                console.log(`Serving DOCX (ID match): ${idDoc}`);
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
