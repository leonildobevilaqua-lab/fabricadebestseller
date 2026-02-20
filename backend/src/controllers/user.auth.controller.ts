
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
                const rawLeads = await getVal('/leads') || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

                userProjects = await Promise.all(projectList
                    .filter((p: any) => {
                        const targetEmail = email.toLowerCase().trim();
                        const pUserEmail = (p.userEmail || "").toLowerCase().trim();
                        const pContactEmail = (p.metadata?.contact?.email || "").toLowerCase().trim();
                        const pMetaUserEmail = (p.metadata?.userEmail || "").toLowerCase().trim();

                        const isMatch = pUserEmail === targetEmail ||
                            pContactEmail === targetEmail ||
                            pMetaUserEmail === targetEmail;

                        return isMatch && p.metadata?.status !== 'DELETED';
                    })
                    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .map(async (p: any) => {
                        // RECOVERY LOGIC: If project metadata is missing valuation/tag, look for it in the latest lead
                        let valuation = p.metadata?.valuation;
                        let pricingTag = p.metadata?.pricingTag;
                        let author = p.metadata?.authorName || "Autor Desconhecido";
                        let title = p.metadata?.bookTitle || p.metadata?.topic || "Projeto Sem Título";

                        if (!valuation || !pricingTag) {
                            // Find matching lead to recover info
                            const matchedLead = leads.slice().reverse().find((l: any) =>
                                l.email?.toLowerCase().trim() === email.toLowerCase().trim() &&
                                (l.tag?.includes('Nível') || l.tag?.includes('Plano'))
                            );
                            if (matchedLead) {
                                valuation = valuation || matchedLead.amount || matchedLead.details?.price;
                                pricingTag = pricingTag || matchedLead.tag || matchedLead.details?.description;
                                author = author === "Autor Desconhecido" ? (matchedLead.authorName || author) : author;
                            }
                        }

                        return {
                            id: p.id,
                            title,
                            author,
                            status: p.metadata?.status || 'PENDING',
                            date: p.createdAt || new Date(),
                            valuation,
                            pricingTag,
                            downloadUrl: p.metadata?.status === 'COMPLETED' || p.metadata?.status === 'LIVRO ENTREGUE' || p.metadata?.status === 'WAITING_DETAILS'
                                ? `/api/admin/books/download/${p.id}`
                                : null
                        };
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
