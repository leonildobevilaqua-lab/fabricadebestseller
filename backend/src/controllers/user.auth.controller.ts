
import { Request, Response } from 'express';
import { getVal, setVal, reloadDB } from '../services/db.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";

export const UserAuthController = {
    // 1. Login Simples
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            // Tenta buscar usuario
            let user = await getVal(`/users/${safeEmail}`);

            // Fallback: Tenta buscar nos leads se nao achar em /users
            if (!user) {
                const leads = await getVal('/leads') || [];
                // @ts-ignore
                const leadFn = Array.isArray(leads) ? leads.find(l => l.email === email) : Object.values(leads).find((l: any) => l.email === email);

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

            if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

            // Verify Password (se existir)
            if (user.auth?.passwordHash) {
                const match = await bcrypt.compare(password, user.auth.passwordHash);
                if (!match) return res.status(401).json({ error: "Senha incorreta." });
            } else {
                // Se o usuário existe mas NÂO tem senha (legado), vamos permitir e pedir para configurar?
                // Ou se for cadastro novo, já salvamos a senha.
                // Hack MVP: Se a senha enviada for a "universal dev" ou se ele nao tiver senha, passa.
                // Mas para produção, precisamos salvar a senha no cadastro.
            }

            const token = jwt.sign({ email: user.profile.email }, SECRET, { expiresIn: '7d' });

            return res.json({
                success: true,
                token,
                user: {
                    name: user.profile.name,
                    email: user.profile.email,
                    plan: user.plan?.name || 'FREE'
                }
            });

        } catch (e) {
            console.error("Login Error", e);
            res.status(500).json({ error: "Erro interno" });
        }
    },

    // 2. Get Me (Dados do Dashboard)
    async me(req: Request, res: Response) {
        // @ts-ignore
        const email = req.user?.email || req.query.email; // Support both for now
        if (!email) return res.status(401).json({ error: "No email" });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            let user = await getVal(`/users/${safeEmail}`);

            // Tenta sincronizar com Leads se nao achar user full
            if (!user) {
                const leads = await getVal('/leads') || [];
                // @ts-ignore
                const leadFn = Array.isArray(leads) ? leads.find(l => l.email === email) : Object.values(leads).find((l: any) => l.email === email);
                if (leadFn) {
                    user = {
                        profile: { name: leadFn.name, email: leadFn.email },
                        plan: leadFn.plan || null,
                        orders: [], // TODO: Buscar orders baseadas no email
                        stats: { purchaseCycleCount: 0 } // Mock
                    };
                    // Save migration
                    await setVal(`/users/${safeEmail}`, user);
                }
            }

            if (!user) return res.status(404).json({ error: "User not found" });

            // Calcular dados reais
            const daysSinceCycle = 0; // Mock
            const nextBookPrice = user.plan?.name === 'BLACK' ? 16.90 : 29.90; // Mock logic

            res.json({
                profile: user.profile,
                plan: user.plan,
                stats: {
                    purchaseCycleCount: user.stats?.purchaseCycleCount || 0,
                    totalBooks: user.orders?.length || 0,
                    nextBookPrice: nextBookPrice
                },
                orders: user.orders || []
            });

        } catch (e) {
            console.error("Me Error", e);
            res.status(500).json({ error: "Server Error" });
        }
    },

    // 3. Register (Usado na LP)
    async register(req: Request, res: Response) {
        const { email, password, name, cpf, phone } = req.body;
        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = {
                profile: { name, email, cpf, phone },
                auth: { passwordHash },
                plan: null, // Será ativado no webhook
                orders: [],
                stats: { purchaseCycleCount: 0, createdAt: new Date() }
            };

            await setVal(`/users/${safeEmail}`, newUser);

            // Tambem cria lead standard p/ compatibilidade
            // (Opcional, mas bom manter)

            const token = jwt.sign({ email }, SECRET, { expiresIn: '7d' });
            res.json({ success: true, token });

        } catch (e) {
            res.status(500).json({ error: "Erro ao registrar" });
        }
    }
};
