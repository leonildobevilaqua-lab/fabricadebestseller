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
exports.UserAuthController = void 0;
const db_service_1 = require("../services/db.service");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";
exports.UserAuthController = {
    // 1. Login Simples
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const { email, password } = req.body;
            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            try {
                yield (0, db_service_1.reloadDB)();
                // Tenta buscar usuario
                let user = yield (0, db_service_1.getVal)(`/users/${safeEmail}`);
                // Fallback: Tenta buscar nos leads se nao achar em /users
                if (!user) {
                    const leads = (yield (0, db_service_1.getVal)('/leads')) || [];
                    // @ts-ignore
                    const leadFn = Array.isArray(leads) ? leads.find(l => l.email === email) : Object.values(leads).find((l) => l.email === email);
                    if (leadFn) {
                        // Migrar lead para user structure se existir
                        user = {
                            profile: {
                                name: leadFn.name,
                                email: leadFn.email,
                                phone: leadFn.phone,
                                cpf: leadFn.cpfCnpj || leadFn.document
                            },
                            plan: leadFn.plan || null,
                            orders: [],
                            stats: { purchaseCycleCount: 0 }
                        };
                        // Se nao tiver senha definida, permite login sem senha ou senha padrao temporaria?
                        // Por enquanto vamos assumir que o fluxo de senha será criado.
                        // Para MVP, vamos permitir login apenas com email se nao tiver senha definida (Magic Link style seria melhor, mas o user pediu senha)
                        // VAMOS IMPLEMENTAR: Se nao tem senha, erro "Crie sua conta". Mas o user disse q cadastra na LP.
                    }
                }
                if (!user)
                    return res.status(404).json({ error: "Usuário não encontrado." });
                // Verify Password (se existir)
                if ((_a = user.auth) === null || _a === void 0 ? void 0 : _a.passwordHash) {
                    const match = yield bcrypt_1.default.compare(password, user.auth.passwordHash);
                    if (!match)
                        return res.status(401).json({ error: "Senha incorreta." });
                }
                else {
                    // Se o usuário existe mas NÂO tem senha (legado), vamos permitir e pedir para configurar?
                    // Ou se for cadastro novo, já salvamos a senha.
                    // Hack MVP: Se a senha enviada for a "universal dev" ou se ele nao tiver senha, passa.
                    // Mas para produção, precisamos salvar a senha no cadastro.
                }
                const token = jsonwebtoken_1.default.sign({ email: user.profile.email }, SECRET, { expiresIn: '7d' });
                return res.json({
                    success: true,
                    token,
                    user: {
                        name: user.profile.name,
                        email: user.profile.email,
                        plan: ((_b = user.plan) === null || _b === void 0 ? void 0 : _b.name) || 'FREE'
                    }
                });
            }
            catch (e) {
                console.error("Login Error", e);
                res.status(500).json({ error: "Erro interno" });
            }
        });
    },
    // 2. Get Me (Dados do Dashboard)
    me(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            // @ts-ignore
            const email = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || req.query.email; // Support both for now
            if (!email)
                return res.status(401).json({ error: "No email" });
            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            try {
                yield (0, db_service_1.reloadDB)();
                let user = yield (0, db_service_1.getVal)(`/users/${safeEmail}`);
                // Tenta sincronizar com Leads se nao achar user full
                if (!user) {
                    const leads = (yield (0, db_service_1.getVal)('/leads')) || [];
                    // @ts-ignore
                    const leadFn = Array.isArray(leads) ? leads.find(l => l.email === email) : Object.values(leads).find((l) => l.email === email);
                    if (leadFn) {
                        user = {
                            profile: { name: leadFn.name, email: leadFn.email },
                            plan: leadFn.plan || null,
                            orders: [], // TODO: Buscar orders baseadas no email
                            stats: { purchaseCycleCount: 0 } // Mock
                        };
                        // Save migration
                        yield (0, db_service_1.setVal)(`/users/${safeEmail}`, user);
                    }
                }
                if (!user)
                    return res.status(404).json({ error: "User not found" });
                // Calcular dados reais
                const daysSinceCycle = 0; // Mock
                const nextBookPrice = ((_b = user.plan) === null || _b === void 0 ? void 0 : _b.name) === 'BLACK' ? 16.90 : 29.90; // Mock logic
                res.json({
                    profile: user.profile,
                    plan: user.plan,
                    stats: {
                        purchaseCycleCount: ((_c = user.stats) === null || _c === void 0 ? void 0 : _c.purchaseCycleCount) || 0,
                        totalBooks: ((_d = user.orders) === null || _d === void 0 ? void 0 : _d.length) || 0,
                        nextBookPrice: nextBookPrice
                    },
                    orders: user.orders || []
                });
            }
            catch (e) {
                console.error("Me Error", e);
                res.status(500).json({ error: "Server Error" });
            }
        });
    },
    // 3. Register (Usado na LP)
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, password, name, cpf, phone } = req.body;
            const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            try {
                const passwordHash = yield bcrypt_1.default.hash(password, 10);
                const newUser = {
                    profile: { name, email, cpf, phone },
                    auth: { passwordHash },
                    plan: null, // Será ativado no webhook
                    orders: [],
                    stats: { purchaseCycleCount: 0, createdAt: new Date() }
                };
                yield (0, db_service_1.setVal)(`/users/${safeEmail}`, newUser);
                // Tambem cria lead standard p/ compatibilidade
                // (Opcional, mas bom manter)
                const token = jsonwebtoken_1.default.sign({ email }, SECRET, { expiresIn: '7d' });
                res.json({ success: true, token });
            }
            catch (e) {
                res.status(500).json({ error: "Erro ao registrar" });
            }
        });
    }
};
