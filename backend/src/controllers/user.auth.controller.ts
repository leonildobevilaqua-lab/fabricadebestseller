
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
                }
            }

            if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

            // Verify Password (se existir)
            if (user.auth?.passwordHash) {
                const match = await bcrypt.compare(password, user.auth.passwordHash);
                if (!match) return res.status(401).json({ error: "Senha incorreta." });
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
                        orders: [],
                        stats: { purchaseCycleCount: 0 }
                    };
                    // Save migration
                    await setVal(`/users/${safeEmail}`, user);
                }
            }

            if (!user) return res.status(404).json({ error: "User not found" });

            // --- REAL CALCULATION (MATCHING PAYMENT CONTROLLER) ---
            let projectsUsage = 0;
            try {
                const projects = await getVal('/projects') || {};
                const projectList = Array.isArray(projects) ? projects : Object.values(projects);
                projectsUsage = projectList.filter((p: any) =>
                    p.userEmail?.toLowerCase().trim() === email.toLowerCase().trim() &&
                    // Consistent status list
                    (p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE' || p.metadata?.status === 'WAITING_DETAILS' || p.metadata?.status === 'WRITING_CHAPTERS')
                ).length;
            } catch (e) { }

            const orders = user.orders || [];
            const paidOrdersCount = orders.length;

            // Usage Count: Max of (Finished Projects) or (Total Paid Orders) 
            const strictUsageCount = Math.max(paidOrdersCount, projectsUsage);

            const pName = (user.plan?.name || "STARTER").toUpperCase();
            let prices = [24.90, 22.41, 21.17, 19.92]; // STARTER DEFAULT
            if (pName.includes('PRO')) prices = [19.90, 17.91, 16.92, 15.92];
            if (pName.includes('BLACK')) prices = [14.90, 13.41, 12.67, 11.92];

            const cycleIndex = strictUsageCount % 4; // 0, 1, 2, 3
            const realNextPrice = prices[cycleIndex] || prices[0];

            // FETCH PROJECTS RICH DATA
            let userProjects: any[] = [];
            try {
                const allProjects = await getVal('/projects') || {};
                const projectList = Array.isArray(allProjects) ? allProjects : Object.values(allProjects);

                userProjects = projectList
                    .filter((p: any) => p.userEmail?.toLowerCase().trim() === email.toLowerCase().trim() && p.metadata?.status !== 'DELETED')
                    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .map((p: any) => ({
                        id: p.id,
                        title: p.metadata?.bookTitle || p.metadata?.topic || "Projeto Sem Título",
                        author: p.metadata?.authorName || "Autor Desconhecido",
                        status: p.metadata?.status || 'PENDING',
                        date: p.createdAt || new Date(),
                        downloadUrl: p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE' || p.metadata?.status === 'WAITING_DETAILS'
                            ? `${process.env.API_URL || 'https://api.fabricadebestseller.com.br'}/downloads/book_${(p.userEmail || "").replace(/[^a-zA-Z0-9._-]/g, '_')}.docx`
                            : null
                    }));
            } catch (e) {
                console.error("Error fetching user projects for dashboard", e);
            }

            res.json({
                profile: user.profile,
                plan: user.plan,
                stats: {
                    purchaseCycleCount: cycleIndex,
                    totalBooksGenerated: strictUsageCount,
                    totalBooks: userProjects.length,
                    nextBookPrice: realNextPrice
                },
                orders: userProjects
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
                plan: null,
                orders: [],
                stats: { purchaseCycleCount: 0, createdAt: new Date() }
            };

            await setVal(`/users/${safeEmail}`, newUser);

            const token = jwt.sign({ email }, SECRET, { expiresIn: '7d' });
            res.json({ success: true, token });

        } catch (e) {
            res.status(500).json({ error: "Erro ao registrar" });
        }
    }
};
