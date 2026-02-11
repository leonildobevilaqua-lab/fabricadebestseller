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
exports.getOrders = exports.restoreBackup = exports.listBackups = exports.createBackup = exports.downloadBook = exports.updateSettings = exports.getSettings = exports.resetPassword = exports.forgotPassword = exports.login = exports.changePassword = void 0;
const ConfigService = __importStar(require("../services/config.service"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const email_service_1 = require("../services/email.service");
const db_service_1 = require("../services/db.service");
const uuid_1 = require("uuid");
// ... (Login logic)
const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";
const DB_PATH = path_1.default.resolve(process.cwd(), 'database.json');
// --- CHANGE PASSWORD (AUTHENTICATED) ---
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { oldPass, newPass } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    try {
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jsonwebtoken_1.default.verify(token, SECRET_KEY);
    }
    catch (e) {
        return res.status(403).json({ error: "Invalid Token" });
    }
    if (!oldPass || !newPass)
        return res.status(400).json({ error: "Missing fields" });
    try {
        const config = yield ConfigService.getConfig();
        const storedPass = config.admin.pass;
        // Verify Old Pass
        let match = false;
        if (storedPass.startsWith('$2b$')) {
            match = yield bcrypt_1.default.compare(oldPass, storedPass);
        }
        else {
            match = (storedPass === oldPass);
        }
        if (!match)
            return res.status(403).json({ error: "Senha atual incorreta" });
        // Hash New Pass
        const hashedPassword = yield bcrypt_1.default.hash(newPass, 10);
        yield ConfigService.updateConfig({
            admin: Object.assign(Object.assign({}, config.admin), { pass: hashedPassword })
        });
        res.json({ success: true });
    }
    catch (e) {
        console.error("Change Pass Error", e);
        res.status(500).json({ error: e.message });
    }
});
exports.changePassword = changePassword;
// --- FORGOT PASSWORD ---
// --- REWRITTEN LOGIN (COMBINED ROBUST LOGIC) ---
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user, pass } = req.body;
        console.log(`[Admin Login Check] User: ${user}`);
        if (!user || !pass)
            return res.status(400).json({ error: "Missing Credentials" });
        const cleanUser = String(user).trim().toLowerCase();
        const cleanPass = String(pass).trim();
        let isAuthenticated = false;
        // 1. HARDCODED "MASTER HATCH" (Prioridade Máxima - Inquebrável)
        // Isso garante acesso mesmo se o banco de dados falhar ou arquivo sumir.
        if (cleanUser === 'contato@leonildobevilaqua.com.br' && cleanPass === 'Leo129520-*-') {
            console.log("✅ Login MASTER 1 (Hardcoded) Autorizado.");
            isAuthenticated = true;
        }
        else if (cleanUser === 'leonildobevilaqua@gmail.com' && cleanPass === 'Leo129520') {
            console.log("✅ Login MASTER 2 (Hardcoded) Autorizado.");
            isAuthenticated = true;
        }
        // 2. CHECK VIA ARQUIVO DATABASE.JSON (Lógica do Usuário Restaurada)
        if (!isAuthenticated) {
            try {
                // Caminho absoluto para evitar erros de CWD
                const dbPath = path_1.default.resolve(process.cwd(), 'database.json');
                if (fs_1.default.existsSync(dbPath)) {
                    const fileContent = fs_1.default.readFileSync(dbPath, 'utf-8');
                    const dbData = JSON.parse(fileContent);
                    // Verifica formato Array (usuários múltiplos)
                    if (Array.isArray(dbData)) {
                        const foundUser = dbData.find((u) => u.email === cleanUser);
                        if (foundUser) {
                            const match = yield bcrypt_1.default.compare(pass, foundUser.password); // Use raw pass for compare
                            if (match) {
                                console.log("✅ Login via DB File (Bcrypt) Autorizado.");
                                isAuthenticated = true;
                            }
                        }
                    }
                    // Verifica formato Objeto (Legado)
                    else if (dbData.admin && dbData.admin.user === cleanUser) {
                        // Check plain or hash
                        if (dbData.admin.pass.startsWith('$2b$')) {
                            if (yield bcrypt_1.default.compare(pass, dbData.admin.pass))
                                isAuthenticated = true;
                        }
                        else {
                            if (dbData.admin.pass === pass)
                                isAuthenticated = true;
                        }
                    }
                }
            }
            catch (fsError) {
                console.error("Warning: DB File Read Error (ignoring)", fsError);
            }
        }
        // 3. CHECK VIA CONFIG SERVICE (Fallback)
        if (!isAuthenticated) {
            try {
                const config = yield ConfigService.getConfig();
                if (config.admin && config.admin.user === cleanUser) {
                    // Check plain or hash
                    if (config.admin.pass.startsWith('$2b$')) {
                        if (yield bcrypt_1.default.compare(pass, config.admin.pass))
                            isAuthenticated = true;
                        // Also check plain just in case config is weird
                    }
                    else if (config.admin.pass === pass) {
                        isAuthenticated = true;
                    }
                }
            }
            catch (svcError) {
                console.error("Warning: ConfigService Error (ignoring)", svcError);
            }
        }
        // FINAL DECISION
        if (isAuthenticated) {
            // @ts-ignore
            const token = jsonwebtoken_1.default.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '8h' });
            return res.json({ token });
        }
        else {
            console.log(`❌ Login Failed for ${cleanUser}`);
            // Retorna 401 explícito com tag da versão
            res.status(401).json({ error: "Invalid credentials (Auth v6.0 - Full Restore)" });
        }
    }
    catch (e) {
        console.error("🔥 CRITICAL LOGIN CRASH:", e);
        res.status(500).json({ error: "Server Login Crash: " + e.message });
    }
});
exports.login = login;
// --- FORGOT PASSWORD ---
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ error: "Email required" });
    try {
        const config = yield ConfigService.getConfig();
        const exists = config.admin.user === email;
        if (!exists) {
            return res.status(404).json({ error: "Admin email not found" });
        }
        const resetToken = (0, uuid_1.v4)();
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        yield (0, db_service_1.setVal)(`/resets/${safeEmail}`, { token: resetToken, expires: Date.now() + 3600000 });
        const origin = req.get('origin') || 'http://localhost:3002';
        const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
        const link = `${cleanOrigin}/admin?resetToken=${resetToken}&email=${email}`;
        console.log(`Sending Reset Link to ${email}: ${link}`);
        yield (0, email_service_1.sendEmail)(email, "Reset de Senha - Admin", `Link para resetar sua senha: ${link}`, undefined, `<p>Clique <a href="${link}">AQUI</a> para resetar sua senha.</p>`);
        res.json({ success: true, message: "Email sent" });
    }
    catch (e) {
        console.error("Forgot Password Error", e);
        res.status(500).json({ error: e.message });
    }
});
exports.forgotPassword = forgotPassword;
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword)
        return res.status(400).json({ error: "Missing fields" });
    try {
        const safeEmail = email.replace(/[^a-zA-Z0-9]/g, '_');
        const stored = yield (0, db_service_1.getVal)(`/resets/${safeEmail}`);
        if (!stored || stored.token !== token || Date.now() > stored.expires) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
        const config = yield ConfigService.getConfig();
        yield ConfigService.updateConfig({
            admin: Object.assign(Object.assign({}, config.admin), { pass: hashedPassword })
        });
        yield (0, db_service_1.setVal)(`/resets/${safeEmail}`, null);
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.resetPassword = resetPassword;
const getSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Normally protect via middleware, simplified here
    const config = yield ConfigService.getConfig();
    // Don't reveal password in settings GET
    const safeConfig = Object.assign(Object.assign({}, config), { admin: Object.assign(Object.assign({}, config.admin), { pass: "***" }) });
    res.json(safeConfig);
});
exports.getSettings = getSettings;
const updateSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updates = req.body;
    // Prevent password overwrite unless specific flow
    if (updates.admin)
        delete updates.admin;
    const newConfig = yield ConfigService.updateConfig(updates);
    const safeConfig = Object.assign(Object.assign({}, newConfig), { admin: Object.assign(Object.assign({}, newConfig.admin), { pass: "***" }) });
    res.json(safeConfig);
});
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
        try {
            // Robust Lookup: Find file containing ID in filename (ignoring prefix like email)
            if (fs.existsSync(outputDir)) {
                const files = fs.readdirSync(outputDir);
                // Priority: ZIP then DOCX
                const zipFile = files.find((f) => f.includes(identifier) && f.endsWith('.zip'));
                const docFile = files.find((f) => f.includes(identifier) && f.endsWith('.docx'));
                if (zipFile) {
                    console.log(`Sending Zip: ${zipFile}`);
                    return res.download(path.join(outputDir, zipFile));
                }
                if (docFile) {
                    console.log(`Sending Doc: ${docFile}`);
                    return res.download(path.join(outputDir, docFile));
                }
            }
        }
        catch (e) {
            console.error("Error reading dir", e);
        }
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
// Imports moved to top
// DB_PATH removed (declared at top)
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
// getVal moved to top
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, db_service_1.reloadDB)();
        const orders = (yield (0, db_service_1.getVal)('/orders')) || [];
        res.json(orders);
    }
    catch (e) {
        console.error("Error getting orders:", e);
        res.json([]);
    }
});
exports.getOrders = getOrders;
