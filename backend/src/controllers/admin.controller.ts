// Last sync: 2026-03-16 15:08 - Emergency Restore
import { Request, Response } from 'express';
import * as ConfigService from '../services/config.service';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/email.service';
import { getVal, setVal, reloadDB, deleteVal } from '../services/db.service';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../services/supabase';

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
// --- REWRITTEN LOGIN (COMBINED ROBUST LOGIC) ---
export const login = async (req: Request, res: Response) => {
    try {
        const { user, pass } = req.body;
        console.log(`[Admin Login Check] User: ${user}`);

        if (!user || !pass) return res.status(400).json({ error: "Missing Credentials" });

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
                const dbPath = path.resolve(process.cwd(), 'database.json');
                if (fs.existsSync(dbPath)) {
                    const fileContent = fs.readFileSync(dbPath, 'utf-8');
                    const dbData = JSON.parse(fileContent);

                    // Verifica formato Array (usuários múltiplos)
                    if (Array.isArray(dbData)) {
                        const foundUser = dbData.find((u: any) => u.email === cleanUser);
                        if (foundUser) {
                            const match = await bcrypt.compare(pass, foundUser.password); // Use raw pass for compare
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
                            if (await bcrypt.compare(pass, dbData.admin.pass)) isAuthenticated = true;
                        } else {
                            if (dbData.admin.pass === pass) isAuthenticated = true;
                        }
                    }
                }
            } catch (fsError) {
                console.error("Warning: DB File Read Error (ignoring)", fsError);
            }
        }

        // 3. CHECK VIA CONFIG SERVICE (Fallback)
        if (!isAuthenticated) {
            try {
                const config = await ConfigService.getConfig();
                if (config.admin && config.admin.user === cleanUser) {
                    // Check plain or hash
                    if (config.admin.pass.startsWith('$2b$')) {
                        if (await bcrypt.compare(pass, config.admin.pass)) isAuthenticated = true;
                        // Also check plain just in case config is weird
                    } else if (config.admin.pass === pass) {
                        isAuthenticated = true;
                    }
                }
            } catch (svcError) {
                console.error("Warning: ConfigService Error (ignoring)", svcError);
            }
        }

        // FINAL DECISION
        if (isAuthenticated) {
            // @ts-ignore
            const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '8h' });
            return res.json({ token });
        } else {
            console.log(`❌ Login Failed for ${cleanUser}`);
            // Retorna 401 explícito com tag da versão
            res.status(401).json({ error: "Invalid credentials (Auth v6.0 - Full Restore)" });
        }

    } catch (e: any) {
        console.error("🔥 CRITICAL LOGIN CRASH:", e);
        res.status(500).json({ error: "Server Login Crash: " + e.message });
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
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "No token provided" });
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jwt.verify(token, SECRET_KEY);

        const config = await ConfigService.getConfig();
        const safeConfig = { ...config, admin: { ...config.admin, pass: "***" } };
        res.json(safeConfig);
    } catch (e: any) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(403).json({ error: "Token inválido ou expirado" });
        }
        res.status(500).json({ error: e.message });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "No token provided" });
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jwt.verify(token, SECRET_KEY);

        const updates = req.body;
        if (updates.admin) delete updates.admin;

        const newConfig = await ConfigService.updateConfig(updates);
        const safeConfig = { ...newConfig, admin: { ...newConfig.admin, pass: "***" } };
        res.json(safeConfig);
    } catch (e: any) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(403).json({ error: "Token inválido ou expirado" });
        }
        res.status(500).json({ error: e.message });
    }
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
        const backupName = `backup_${timestamp}`;

        // Get everything except existing backups
        const { data, error } = await supabase.from('kv_store').select('*').not('key', 'like', 'backup_%');
        if (error) throw error;

        // Save as a single large string
        const backupString = JSON.stringify(data);

        // Store the backup in KV store under the backup key
        await supabase.from('kv_store').insert({
            key: backupName,
            value: backupString,
            updated_at: new Date().toISOString()
        });

        res.json({ success: true, name: backupName + '.json' });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const listBackups = async (req: Request, res: Response) => {
    try {
        // 1. Check Supabase
        const { data, error } = await supabase.from('kv_store').select('key, updated_at').like('key', 'backup_%');
        const supabaseFiles = (data || []).map((row: any) => ({ name: `${row.key}.json`, time: new Date(row.updated_at).getTime() }));

        // 2. Check Local DB
        const { getVal, getLocalDB } = require('../services/db.service');
        const localDB = getLocalDB();
        const localFiles: any[] = [];
        for (const [k, v] of Object.entries(localDB)) {
            if (k.startsWith('backup_')) {
                localFiles.push({ name: `${k}.json`, time: Date.now() }); // Use now as fallback time
            }
        }

        const allFiles = [...supabaseFiles, ...localFiles];
        // Unique names
        const unique = Array.from(new Set(allFiles.map(f => f.name))).map(name => allFiles.find(f => f.name === name));
        const sorted = unique.sort((a: any, b: any) => b.time - a.time).map((f: any) => f.name);

        res.json(sorted);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}

export const restoreBackup = async (req: Request, res: Response) => {
    try {
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: "Filename required" });

        const key = filename.replace('.json', '');

        const { data, error } = await supabase.from('kv_store').select('value').eq('key', key).maybeSingle();
        if (error || !data) return res.status(404).json({ error: "Backup file not found" });

        let backupRows = [];
        try {
            backupRows = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        } catch (parseError) {
            return res.status(500).json({ error: "Failed to parse backup content." });
        }

        // 1. Delete all current data EXCEPT backups
        await supabase.from('kv_store').delete().not('key', 'like', 'backup_%');

        // 2. Insert backup rows
        for (const row of backupRows) {
            await supabase.from('kv_store').insert({
                key: row.key,
                value: row.value,
                updated_at: new Date().toISOString()
            });
        }

        // 3. Reload in-memory state
        await reloadDB();

        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}

// getVal moved to top

export const getOrders = async (req: Request, res: Response) => {
    try {
        // 1. Get all projects (the source of truth for the "Book History" requested)
        const projectsArray = await getVal('/projects') || [];
        const projects = Array.isArray(projectsArray) ? projectsArray : Object.values(projectsArray);

        // 2. Prepare Directory for file checking (optional but good for download validation)
        const outputDir = path.join(__dirname, '../../generated_books');
        const hasFiles = fs.existsSync(outputDir);
        const folderFiles = hasFiles ? fs.readdirSync(outputDir) : [];

        // 3. Transform projects into the enriched format the Admin UI needs
        const projectHistory = projects.map((p: any) => {
            const metadata = p.metadata || {};
            const projectId = p.id || metadata.id;
            
            // Replicate info from VIP Area: Title, Author, Date, Status
            const bookTitle = metadata.bookTitle || metadata.title || metadata.topic || "Geração de IA";
            const authorName = metadata.contact?.name || metadata.authorName || p.authorName || "Cliente";
            const customerEmail = metadata.contact?.email || p.email || metadata.userEmail || "N/A";
            
            // Physical file check
            let downloadLink = metadata.downloadUrl || metadata.kitUrl || metadata.docLink || `/api/projects/${projectId}/download`;
            
            return {
                id: projectId,
                date: p.createdAt || metadata.createdAt || p.date || new Date(),
                title: bookTitle,
                authorName: authorName,
                customerEmail: customerEmail,
                status: (metadata.status || p.status || "READY").toUpperCase(),
                projectId: projectId,
                downloadUrl: downloadLink,
                isProject: true
            };
        });

        // 4. Final Sort - Newer first
        const sorted = projectHistory.sort((a: any, b: any) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });

        res.json(sorted);
    } catch (e: any) {
        console.error("🔥 CRITICAL ADMIN ORDERS ERROR:", e);
        res.status(500).json({ error: "Erro ao carregar histórico: " + e.message });
    }
};

// ---- ASAAS ENVIRONMENT SWITCH ----
// Alterna entre sandbox e production. As chaves já estão no Coolify como
// ASAAS_SANDBOX_KEY e ASAAS_PRODUCTION_KEY — não precisamos recebê-las aqui.
export const switchAsaasEnv = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: "No token provided" });
        const token = authHeader.split(' ')[1];
        // @ts-ignore
        jwt.verify(token, SECRET_KEY);

        const { env } = req.body;
        if (env !== 'sandbox' && env !== 'production') {
            return res.status(400).json({ error: "env deve ser 'sandbox' ou 'production'" });
        }

        // Verifica se a chave para o ambiente alvo está disponível
        const keyVar = env === 'production' ? 'ASAAS_PRODUCTION_KEY' : 'ASAAS_SANDBOX_KEY';
        if (!process.env[keyVar]) {
            return res.status(400).json({
                error: `${keyVar} não está configurada no servidor. Configure esta variável no Coolify antes de alternar para ${env === 'production' ? 'Produção' : 'Sandbox'}.`
            });
        }

        // Persiste no DB para sobreviver a restarts (usando o ConfigService para manter integridade)
        await ConfigService.updateConfig({ asaas_env: env } as any);

        // Aplica imediatamente no processo atual
        process.env.ASAAS_ENV = env;

        const envLabel = env === 'production' ? 'Produção 🟢' : 'Sandbox 🟡';
        console.log(`[ASAAS] ✅ Ambiente alterado para: ${envLabel}`);
        res.json({ success: true, env, message: `Ambiente Asaas alterado para ${envLabel}` });
    } catch (e: any) {
        if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
            return res.status(403).json({ error: "Token inválido ou expirado" });
        }
        console.error("switchAsaasEnv Error:", e);
        res.status(500).json({ error: e.message });
    }
};

// ---- GET ASAAS STATUS ----
export const getAsaasStatus = async (req: Request, res: Response) => {
    try {
        const config = await ConfigService.getConfig();
        const env = config.asaas_env || process.env.ASAAS_ENV || 'sandbox';

        // Verifica quais chaves estão disponíveis no ambiente
        const hasSandboxKey = !!process.env.ASAAS_SANDBOX_KEY;
        const hasProductionKey = !!process.env.ASAAS_PRODUCTION_KEY;
        res.json({ env, hasSandboxKey, hasProductionKey });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};


export const wipeUserHistory = async (req: Request, res: Response) => {
    try {
        const { email } = req.params;
        if (!email) return res.status(400).json({ error: "Email requerido" });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        // Wipe Profile and Credits
        await setVal(`/users/${safeEmail}`, null);
        await setVal(`/credits/${safeEmail}`, null);

        // Wipe Leads
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        const filteredLeads = leads.filter((l: any) => l.email?.toLowerCase().trim() !== email.toLowerCase().trim());
        await setVal('/leads', filteredLeads);

        // Wipe Projects
        const rawProjects = await getVal('/projects') || [];
        const projects = Array.isArray(rawProjects) ? rawProjects : Object.values(rawProjects);
        const filteredProjects = projects.filter((p: any) => p.metadata?.contact?.email?.toLowerCase().trim() !== email.toLowerCase().trim());
        await setVal('/projects', filteredProjects);

        res.json({ success: true, message: `Histórico apagado para ${email}` });
    } catch (e: any) {
        console.error("Wipe Error:", e);
        res.status(500).json({ error: e.message });
    }
};

export const wipeAllHistory = async (req: Request, res: Response) => {
    try {
        console.warn("⚠️ WIPE ALL HISTORY TRIGGERED BY ADMIN!");

        // Use true deleteVal to actually remove all keys matching the path pattern in Supabase KV store
        await deleteVal('/leads');
        await deleteVal('/projects');
        await deleteVal('/orders');
        await deleteVal('/extra_orders');
        await deleteVal('/users');
        await deleteVal('/credits');

        await reloadDB();
        res.json({ success: true, message: "Todos os registros (Leads, Pedidos, Usuários e Projetos) foram apagados completamente." });
    } catch (e: any) {
        console.error("Wipe All Error:", e);
        res.status(500).json({ error: e.message });
    }
};
