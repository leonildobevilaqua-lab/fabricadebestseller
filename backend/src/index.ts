import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import fs from 'fs';       // Adicionado para salvar o arquivo
import bcrypt from 'bcrypt'; // Adicionado para criptografar a senha
import path from 'path';     // Adicionado para achar a pasta certa

// OVERRIDE: Garantir que o ambiente de produção seja mantido a menos que explicitamente sandbox
process.env.ASAAS_ENV = process.env.ASAAS_ENV || 'production';

const PORT = process.env.PORT || 3005;

// --- INICIO DO BLOCO SALVA-VIDAS (CHAVEIRO MESTRE) ---
import { setVal, getVal, pushVal } from './services/db.service';

// Inicializa a configuração do Asaas a partir do DB
(async () => {
    try {
        const config = (await getVal('/settings')) || {};
        if (config.asaas_env) {
            process.env.ASAAS_ENV = config.asaas_env;
            console.log(`[BOOT] Asaas Environment set to: ${config.asaas_env}`);
        }
    } catch (e) {
        console.error("Erro ao carregar config inicial", e);
    }
})();

app.get('/reset-admin-force', async (req, res) => {
    try {
        console.log("Iniciando reset forçado de senha no Supabase...");

        const passwordHash = await bcrypt.hash('Leo129520-*-', 10);
        const adminEmail = 'contato@leonildobevilaqua.com.br';
        const safeEmail = adminEmail.replace(/[^a-zA-Z0-9]/g, '_');

        const adminUser = {
            profile: { name: "Admin (Leonildo)", email: adminEmail },
            auth: { passwordHash: passwordHash },
            plan: { name: "BLACK", status: "ACTIVE", billing: "annual" },
            stats: { createdAt: new Date().toISOString() }
        };

        // Força créditos para 14
        await setVal(`/credits/${safeEmail}`, 14);
        await setVal(`/users/${safeEmail}/bookCredits`, 14);
        
        // Ativa o plano BLACK
        await setVal(`/users/${safeEmail}`, adminUser);
        await setVal(`/users/${safeEmail}/plan`, { name: "BLACK", status: "ACTIVE", billing: "annual" });
        
        await setVal(`/admin`, { user: adminEmail, pass: 'Leo129520-*-' });

        res.json({ success: true, message: "Acesso e Créditos (14) Restaurados para Leonildo. Tente logar no Admin." });
    } catch (error) {
        res.status(500).json({ error: String(error) });
    }
});

app.get('/migrate-full-supabase', async (req, res) => {
    try {
        const dbPath = path.resolve(process.cwd(), 'database.json');
        if (!fs.existsSync(dbPath)) return res.status(404).json({ error: "database.json not found" });

        const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        console.log("Starting Full Migration to Supabase...");

        let migratedCount = 0;
        const rootKeys = Object.keys(data);

        for (const key of rootKeys) {
            const val = data[key];
            const pathKey = `/${key}`;

            const collections = ['projects', 'leads', 'users', 'credits', 'orders', 'extra_orders'];
            if (collections.includes(key) && Array.isArray(val)) {
                console.log(`Migrating collection: ${pathKey} (${val.length} items)`);
                for (const item of val) {
                    await pushVal(pathKey, item);
                    migratedCount++;
                }
            } else {
                console.log(`Migrating single doc: ${pathKey}`);
                await setVal(pathKey, val);
                migratedCount++;
            }
        }

        res.json({ success: true, migratedCount, keys: rootKeys });
    } catch (e: any) {
        console.error("Migration Error", e);
        res.status(500).json({ error: e.message });
    }
});
// --- FIM DO BLOCO SALVA-VIDAS ---

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - Updated ${new Date().toISOString()}`);
    console.log("PRODUCTION RESTORE MODE ACTIVATED - INCIDENT RESOLVED 17:50");

    app._router.stack.forEach((r: any) => {
        if (r.route && r.route.path) {
            console.log(r.route.path);
        }
    });
});