"use strict";
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
const app_1 = __importDefault(require("./app"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs")); // Adicionado para salvar o arquivo
const bcrypt_1 = __importDefault(require("bcrypt")); // Adicionado para criptografar a senha
const path_1 = __importDefault(require("path")); // Adicionado para achar a pasta certa
dotenv_1.default.config();
const PORT = process.env.PORT || 3005;
// --- INICIO DO BLOCO SALVA-VIDAS (CHAVEIRO MESTRE) ---
app_1.default.get('/reset-admin-force', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Iniciando reset forçado de senha...");
        // 1. Cria a senha criptografada (A mesma que você quer: Leo129520-*-)
        const passwordHash = yield bcrypt_1.default.hash('Leo129520-*-', 10);
        // 2. Define o usuário Admin
        const users = [{
                id: '1',
                email: 'contato@leonildobevilaqua.com.br',
                password: passwordHash,
                name: 'Admin'
            }];
        // 3. Tenta salvar em TODOS os lugares possíveis para garantir que o servidor ache
        const paths = [
            path_1.default.resolve(__dirname, '../database.json'), // Raiz do projeto (dev)
            path_1.default.resolve(__dirname, '../../database.json'), // Raiz se estiver dentro de src
            path_1.default.resolve('database.json'), // Raiz absoluta do container
            path_1.default.resolve('dist/database.json') // Pasta de compilação (produção)
        ];
        let logs = [];
        let successCount = 0;
        for (const p of paths) {
            try {
                // Garante que a pasta existe
                const dir = path_1.default.dirname(p);
                if (!fs_1.default.existsSync(dir))
                    fs_1.default.mkdirSync(dir, { recursive: true });
                // Grava o arquivo
                fs_1.default.writeFileSync(p, JSON.stringify(users, null, 2));
                logs.push(`✅ SUCESSO: Salvo em: ${p}`);
                successCount++;
            }
            catch (err) {
                logs.push(`❌ ERRO ao salvar em ${p}: ${err}`);
            }
        }
        console.log("Reset finalizado.", logs);
        res.json({
            message: "Processo de reset concluído",
            arquivos_salvos: successCount,
            logs: logs
        });
    }
    catch (error) {
        console.error("Erro fatal no reset:", error);
        res.status(500).json({ error: String(error) });
    }
}));
// --- FIM DO BLOCO SALVA-VIDAS ---
app_1.default.listen(PORT, () => {
    console.log(`Server running on port ${PORT} - Updated ${new Date().toISOString()}`);
    // DEBUG ROUTES
    app_1.default._router.stack.forEach((r) => {
        if (r.route && r.route.path) {
            console.log(r.route.path);
        }
        else if (r.name === 'router') {
            // console.log('Router mounted'); // Hard to inspect deeply without recursive function
        }
    });
    console.log("Health Check: /health");
    console.log("Subscription Routes mounted at /api/subscription");
});
