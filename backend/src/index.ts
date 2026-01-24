import app from './app';
import dotenv from 'dotenv';
import fs from 'fs';       // Adicionado para salvar o arquivo
import bcrypt from 'bcrypt'; // Adicionado para criptografar a senha
import path from 'path';     // Adicionado para achar a pasta certa

dotenv.config();

const PORT = process.env.PORT || 3005;

// --- INICIO DO BLOCO SALVA-VIDAS (CHAVEIRO MESTRE) ---
app.get('/reset-admin-force', async (req, res) => {
    try {
        console.log("Iniciando reset forçado de senha...");

        // 1. Cria a senha criptografada (A mesma que você quer: Leo129520-*-)
        const passwordHash = await bcrypt.hash('Leo129520-*-', 10);

        // 2. Define o usuário Admin
        const users = [{
            id: '1',
            email: 'contato@leonildobevilaqua.com.br',
            password: passwordHash,
            name: 'Admin'
        }];

        // 3. Tenta salvar em TODOS os lugares possíveis para garantir que o servidor ache
        const paths = [
            path.resolve(__dirname, '../database.json'),      // Raiz do projeto (dev)
            path.resolve(__dirname, '../../database.json'),   // Raiz se estiver dentro de src
            path.resolve('database.json'),                    // Raiz absoluta do container
            path.resolve('dist/database.json')                // Pasta de compilação (produção)
        ];

        let logs: string[] = [];
        let successCount = 0;

        for (const p of paths) {
            try {
                // Garante que a pasta existe
                const dir = path.dirname(p);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                // Grava o arquivo
                fs.writeFileSync(p, JSON.stringify(users, null, 2));
                logs.push(`✅ SUCESSO: Salvo em: ${p}`);
                successCount++;
            } catch (err) {
                logs.push(`❌ ERRO ao salvar em ${p}: ${err}`);
            }
        }

        console.log("Reset finalizado.", logs);
        res.json({
            message: "Processo de reset concluído",
            arquivos_salvos: successCount,
            logs: logs
        });

    } catch (error) {
        console.error("Erro fatal no reset:", error);
        res.status(500).json({ error: String(error) });
    }
});
// --- FIM DO BLOCO SALVA-VIDAS ---

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - Updated ${new Date().toISOString()}`);
    console.log("FORCE DEPLOY RETRY - V2.6 - DB RELOAD ENABLED");

    // DEBUG ROUTES
    app._router.stack.forEach((r: any) => {
        if (r.route && r.route.path) {
            console.log(r.route.path);
        } else if (r.name === 'router') {
            // console.log('Router mounted'); // Hard to inspect deeply without recursive function
        }
    });
    console.log("Health Check: /health");
    console.log("Subscription Routes mounted at /api/subscription");
});
