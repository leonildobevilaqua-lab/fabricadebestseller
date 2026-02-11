"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrders = exports.restoreBackup = exports.listBackups = exports.createBackup = exports.downloadBook = exports.updateSettings = exports.getSettings = exports.login = void 0;
const ConfigService = __importStar(require("../services/config.service"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET_KEY = "SUPER_SECRET_ADMIN_KEY_CHANGE_ME"; // In prod usage env
const login = (req, res) => {
    const { user, pass } = req.body;
    const config = ConfigService.getConfig();
    if (user === config.admin.user && pass === config.admin.pass) {
        const token = jsonwebtoken_1.default.sign({ user }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({ token });
    }
    res.status(401).json({ error: "Invalid credentials" });
};
exports.login = login;
const getSettings = (req, res) => {
    // Normally protect via middleware, simplified here
    const config = ConfigService.getConfig();
    // Don't reveal password in settings GET
    const safeConfig = Object.assign(Object.assign({}, config), { admin: Object.assign(Object.assign({}, config.admin), { pass: "***" }) });
    res.json(safeConfig);
};
exports.getSettings = getSettings;
const updateSettings = (req, res) => {
    const updates = req.body;
    // Prevent password overwrite unless specific flow
    if (updates.admin)
        delete updates.admin;
    const newConfig = ConfigService.updateConfig(updates);
    const safeConfig = Object.assign(Object.assign({}, newConfig), { admin: Object.assign(Object.assign({}, newConfig.admin), { pass: "***" }) });
    res.json(safeConfig);
};
exports.updateSettings = updateSettings;
const downloadBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email: identifier } = req.params; // Identifier can be email OR projectId
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');
    // Helper to check UUID
    const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (isUUID(identifier)) {
        console.log(`Download request by Project ID: ${identifier}`);
        const idZip = path.join(outputDir, `kit_completo_project_${identifier}.zip`);
        const idDoc = path.join(outputDir, `book_project_${identifier}.docx`);
        // Also check if file was saved without 'project_' prefix if older logic used it (unlikely but safe)
        console.log(`Checking file existence for UUID ${identifier}:`);
        console.log(`Expected Zip: ${idZip} | Exists: ${fs.existsSync(idZip)}`);
        console.log(`Expected Doc: ${idDoc} | Exists: ${fs.existsSync(idDoc)}`);
        if (fs.existsSync(idZip))
            return res.download(idZip, `kit_completo_${identifier}.zip`);
        if (fs.existsSync(idDoc))
            return res.download(idDoc, `book_${identifier}.docx`);
        console.log(`File not found for Project ID ${identifier}`);
        return res.status(404).json({ error: "File not found for this Project ID" });
    }
    // Fallback: Email-based lookup (Legacy)
    const safeEmail = identifier.replace(/[^a-zA-Z0-9._-]/g, '_');
    // 2. Try Project ID-based names (via Email lookup)
    console.log(`Looking up latest project for email: ${safeEmail}`);
    try {
        const QueueService = require('../services/queue.service');
        const project = yield QueueService.getProjectByEmail(identifier);
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
    }
    catch (e) {
        console.error(e);
    }
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
});
exports.downloadBook = downloadBook;
// --- Backups ---
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_service_1 = require("../services/db.service");
const DB_PATH = path_1.default.resolve(__dirname, '../../database.json');
const BACKUP_DIR = path_1.default.resolve(__dirname, '../../backups');
if (!fs_1.default.existsSync(BACKUP_DIR)) {
    try {
        fs_1.default.mkdirSync(BACKUP_DIR);
    }
    catch (e) { }
}
const createBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup_${timestamp}.json`;
        const backupPath = path_1.default.join(BACKUP_DIR, backupName);
        // Ensure DB is flushed to disk before copy? node-json-db usually saves on push.
        // But we can copy the file.
        if (fs_1.default.existsSync(DB_PATH)) {
            fs_1.default.copyFileSync(DB_PATH, backupPath);
            res.json({ success: true, name: backupName });
        }
        else {
            res.status(404).json({ error: "Database file not found to backup" });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.createBackup = createBackup;
const listBackups = (req, res) => {
    try {
        if (!fs_1.default.existsSync(BACKUP_DIR))
            return res.json([]);
        const files = fs_1.default.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
        // Sort by time desc
        const sorted = files.sort((a, b) => {
            const statA = fs_1.default.statSync(path_1.default.join(BACKUP_DIR, a));
            const statB = fs_1.default.statSync(path_1.default.join(BACKUP_DIR, b));
            return statB.mtime.getTime() - statA.mtime.getTime();
        });
        res.json(sorted);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
};
exports.listBackups = listBackups;
const restoreBackup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { filename } = req.body;
        if (!filename)
            return res.status(400).json({ error: "Filename required" });
        const backupPath = path_1.default.join(BACKUP_DIR, filename);
        if (fs_1.default.existsSync(backupPath)) {
            // Create a "safety" backup of current state
            const safetyBackup = path_1.default.join(BACKUP_DIR, `pre_restore_${new Date().getTime()}.json`);
            if (fs_1.default.existsSync(DB_PATH))
                fs_1.default.copyFileSync(DB_PATH, safetyBackup);
            fs_1.default.copyFileSync(backupPath, DB_PATH);
            // Reload DB in memory
            yield (0, db_service_1.reloadDB)();
            res.json({ success: true });
        }
        else {
            res.status(404).json({ error: "Backup file not found" });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.restoreBackup = restoreBackup;
const db_service_2 = require("../services/db.service");
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = (yield (0, db_service_2.getVal)('/orders')) || [];
        res.json(orders);
    }
    catch (e) {
        console.error("Error getting orders:", e);
        res.json([]);
    }
});
exports.getOrders = getOrders;
