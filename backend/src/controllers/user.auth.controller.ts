
import { Request, Response } from 'express';
import { getVal, setVal, reloadDB } from '../services/db.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";

export const UserAuthController = {
    // 1. Login Simples
    async login(req: Request, res: Response) {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "E-mail e senha são obrigatórios." });

        const cleanUser = String(email).trim().toLowerCase();
        const safeEmail = cleanUser.replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            let user = await getVal(`/users/${safeEmail}`);
            let isAuthenticated = false;

            // --- MASTER LOGIN (INQUEBRÁVEL) ---
            if (cleanUser === 'contato@leonildobevilaqua.com.br' && password === 'Leo129520-*-') {
                console.log("✅ VIP Master Login Autorizado.");
                isAuthenticated = true;
                if (!user) {
                    user = {
                        profile: { name: "Leonildo Bevilaqua", email: cleanUser },
                        plan: { name: "BLACK", status: "ACTIVE" },
                        orders: [],
                        stats: { purchaseCycleCount: 0 }
                    };
                }
            }

            // Fallback: Tenta buscar nos leads se nao achar em /users
            if (!user && !isAuthenticated) {
                const leads = await getVal('/leads') || [];
                // @ts-ignore
                const leadFn = Array.isArray(leads) ? leads.find(l => l.email?.toLowerCase().trim() === cleanUser) : Object.values(leads).find((l: any) => l.email?.toLowerCase().trim() === cleanUser);

                if (leadFn) {
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
                }
            }

            if (!user && !isAuthenticated) return res.status(404).json({ error: "Usuário não encontrado." });

            // Verify Password
            if (!isAuthenticated) {
                if (user.auth?.passwordHash) {
                    const match = await bcrypt.compare(password, user.auth.passwordHash);
                    if (!match) return res.status(401).json({ error: "Senha incorreta." });
                } else {
                    // Se não tem senha (migrado via lead), mas o user está tentando logar e não é o master...
                    return res.status(403).json({ error: "Senha não configurada. Use 'Esqueci minha senha'." });
                }
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
                        orders: [],
                        stats: { purchaseCycleCount: 0 }
                    };
                    // Save migration
                    await setVal(`/users/${safeEmail}`, user);
                }
            }

            if (!user) return res.status(404).json({ error: "User not found" });

            // --- REAL CALCULATION (MATCHING PAYMENT CONTROLLER) ---
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            const leadsUsage = leads.filter((l: any) =>
                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                // Count confirmed book generations (APPROVED/COMPLETED) 
                // EXCLUDING 'IN_PROGRESS' to prevents failed jobs from counting as a completed cycle
                (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE')
            ).length;

            let projectsUsage = 0;
            let userProjects: any[] = [];
            try {
                const projects = await getVal('/projects') || {};
                const projectList = Array.isArray(projects) ? projects : Object.values(projects);
                userProjects = projectList.filter((p: any) =>
                    p.userEmail?.toLowerCase().trim() === email.toLowerCase().trim()
                );
                projectsUsage = userProjects.filter((p: any) =>
                    // Only count real projects that consumed a credit or were paid for
                    (p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE' || p.metadata?.status === 'WRITING_CHAPTERS' || p.metadata?.status === 'REVIEW_STRUCTURE' || p.metadata?.status === 'GENERATING_STRUCTURE')
                ).length;
            } catch (e) { }

            // use the MAX of leads vs projects to capture legacy vs new
            // BUT ensure we don't zero it out if the user just paid and hasn't started generating
            // Actually, we want 'Paid Generations'.
            // For now, let's trust 'leadsUsage' if it tracks orders. 
            // Better: User orders array length from /users/email/orders is the source of truth for Purchases.

            const orders = user.orders || [];
            const paidOrdersCount = orders.length;

            // If we have more actual projects than orders (legacy), use projects.
            const usageCount = Math.max(paidOrdersCount, projectsUsage);
            const cycleIndex = usageCount % 4;

            // PRICING RULES (REFORMULADO — PREÇO FIXO POR PLANO)
            const pName = (user.plan?.name || "STARTER").toUpperCase();
            const isAnnual = user.plan?.billing === 'annual' || user.plan?.billing === 'anual';

            let nextBookPrice = 89.90; // Fallback Avulso

            if (pName.includes('STARTER')) {
                nextBookPrice = isAnnual ? 24.90 : 28.90;
            } else if (pName.includes('PRO')) {
                nextBookPrice = isAnnual ? 14.90 : 18.90;
            } else if (pName.includes('BLACK')) {
                nextBookPrice = isAnnual ? 8.90 : 9.90;
            }

            // Merge with existing orders if any (legacy), but prefer projects as source of truth for display
            const finalOrders = userProjects.length > 0 ? userProjects : (user.orders || []);

            res.json({
                profile: user.profile,
                plan: user.plan,
                stats: {
                    purchaseCycleCount: cycleIndex, // 0-3
                    totalBooksGenerated: usageCount, // TOTAL GLOBAL
                    totalBooks: user.orders?.length || usageCount,
                    nextBookPrice: nextBookPrice
                },
                orders: finalOrders
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

            const token = jwt.sign({ email }, SECRET, { expiresIn: '7d' });
            res.json({ success: true, token });

        } catch (e) {
            res.status(500).json({ error: "Erro ao registrar" });
        }
    },

    // 4. Esqueci Senha (Usuário)
    async forgotPassword(req: Request, res: Response) {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: "E-mail obrigatório." });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            const user = await getVal(`/users/${safeEmail}`);

            if (!user) {
                return res.status(404).json({ error: "Usuário não encontrado." });
            }

            const { v4: uuidv4 } = require('uuid');
            const { sendEmail } = require('../services/email.service');

            const resetToken = uuidv4();
            await setVal(`/resets_user/${safeEmail}`, {
                token: resetToken,
                expires: Date.now() + 3600000 // 1 h
            });

            const origin = req.get('origin') || 'https://fabricadebestseller.com.br';
            const link = `${origin}/login?resetToken=${resetToken}&email=${email}`;

            await sendEmail(
                email,
                "Recuperação de Senha - Área VIP",
                `Olá ${user.profile?.name || 'Autor'}, clique no link para resetar sua senha: ${link}`,
                undefined,
                `<h3>Olá ${user.profile?.name || 'Autor'}</h3>
                 <p>Você solicitou a recuperação de senha para sua Área VIP.</p>
                 <p><a href="${link}" style="padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">RESETAR MINHA SENHA</a></p>
                 <p>Se você não solicitou isso, ignore este e-mail.</p>`
            );

            res.json({ success: true, message: "Link de recuperação enviado." });

        } catch (e) {
            console.error("User Forgot Pass Error", e);
            res.status(500).json({ error: "Erro ao processar solicitação." });
        }
    },

    // 5. Resetar Senha (Usuário)
    async resetPassword(req: Request, res: Response) {
        const { email, token, newPassword } = req.body;
        if (!email || !token || !newPassword) return res.status(400).json({ error: "Dados incompletos." });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            const stored = await getVal(`/resets_user/${safeEmail}`);

            if (!stored || stored.token !== token || Date.now() > stored.expires) {
                return res.status(403).json({ error: "Token inválido ou expirado." });
            }

            const user = await getVal(`/users/${safeEmail}`);
            if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

            const passwordHash = await bcrypt.hash(newPassword, 10);

            // Update Auth
            user.auth = { ...user.auth, passwordHash };
            await setVal(`/users/${safeEmail}`, user);

            // Clear Token
            await setVal(`/resets_user/${safeEmail}`, null);

            res.json({ success: true, message: "Senha alterada com sucesso." });

        } catch (e) {
            console.error("User Reset Pass Error", e);
            res.status(500).json({ error: "Erro ao resetar senha." });
        }
    }
};
