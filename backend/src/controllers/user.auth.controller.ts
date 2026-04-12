
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
                const leadsArray = Array.isArray(leads) ? leads : Object.values(leads);

                let leadFn: any;
                for (let i = leadsArray.length - 1; i >= 0; i--) {
                    if ((leadsArray[i] as any).email?.toLowerCase().trim() === cleanUser) {
                        leadFn = leadsArray[i];
                        break;
                    }
                }

                if (leadFn) {
                    user = {
                        profile: {
                            name: leadFn.name || "Autor",
                            email: cleanUser,
                            phone: leadFn.phone || "",
                            cpf: leadFn.cpfCnpj || leadFn.document || ""
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
    async me(req: Request, res: Response) {
        // @ts-ignore
        const email = req.user?.email || req.query.email;
        if (!email) return res.status(401).json({ error: "No email" });

        const cleanUser = String(email).trim().toLowerCase();
        const safeEmail = cleanUser.replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            let user = await getVal(`/users/${safeEmail}`);

            // 1. Tenta sincronizar com Leads se nao achar user full ou se estiver faltando o profile (ex: criado via webhook)
            if (!user || !user.profile || !user.plan) {
                const leads = await getVal('/leads') || [];
                const leadsArray = Array.isArray(leads) ? leads : Object.values(leads);

                // Pesquisa de trás para frente para pegar o lead mais recente
                let leadFn: any;
                for (let i = leadsArray.length - 1; i >= 0; i--) {
                    if ((leadsArray[i] as any).email?.toLowerCase().trim() === cleanUser) {
                        leadFn = leadsArray[i];
                        break;
                    }
                }

                if (leadFn) {
                    user = {
                        ...(user || {}), // preserva keys parciais (ex: bookCredits, auth, etc)
                        profile: user?.profile || { name: leadFn.name || "Autor", email: cleanUser, phone: leadFn.phone || "", cpf: leadFn.cpfCnpj || leadFn.document || "" },
                        plan: user?.plan || leadFn.plan || null, // NUNCA sobrescreve um plano existente
                        orders: user?.orders || [],
                        stats: user?.stats || { purchaseCycleCount: 0 }
                    };
                    await setVal(`/users/${safeEmail}`, user);
                }
            }

            if (!user) return res.status(404).json({ error: "User not found" });

            // --- 2. RESILIENCE SYNC (ASAAS TRUTH) ---
            // Se o plano não estiver ativo, ou se for o e-mail master, vamos forçar uma checagem no Asaas
            const isMaster = cleanUser === 'contato@leonildobevilaqua.com.br';

            if (isMaster || !user.plan || user.plan.status !== 'ACTIVE') {
                try {
                    const { AsaasProvider } = require('../services/asaas.provider');
                    const customer = await AsaasProvider.getCustomerByEmail(cleanUser);
                    if (customer) {
                        const payments = await AsaasProvider.getPayments({ customer: customer.id, limit: 10 });
                        const confirmedPayment = payments.find((p: any) =>
                            (p.status === 'RECEIVED' || p.status === 'CONFIRMED') &&
                            (p.description || "").toLowerCase().match(/assinatura|plano|starter|pro|black/)
                        );

                        if (confirmedPayment || isMaster) {
                            console.log(`[AUTH_ME] Resilient activation for ${cleanUser}`);
                            const desc = (confirmedPayment?.description || '').toUpperCase();
                            let pName = 'STARTER';
                            if (desc.includes('BLACK') || isMaster) pName = 'BLACK';
                            else if (desc.includes('PRO')) pName = 'PRO';

                            const newPlan = {
                                status: 'ACTIVE',
                                name: pName,
                                billing: (desc.includes('ANUAL')) ? 'annual' : 'monthly',
                                lastPayment: new Date(),
                                startDate: new Date(),
                                subscriptionId: confirmedPayment?.subscription || null
                            };
                            user.plan = newPlan;
                            await setVal(`/users/${safeEmail}/plan`, newPlan);
                        }
                    }
                    else if (isMaster) {
                        // Se for master e nem tiver no asaas ainda (teste local), ativa mesmo assim
                        user.plan = { status: 'ACTIVE', name: 'BLACK', billing: 'monthly' };
                    }
                } catch (asaasErr) {
                    console.error("[ME_SYNC_ERROR]", asaasErr);
                }
            }

            // --- 3. CALCULATIONS ---
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            const userProjectsRaw = await getVal('/projects') || [];
            const projectList = Array.isArray(userProjectsRaw) ? userProjectsRaw : Object.values(userProjectsRaw);

            const userProjects = projectList.filter((p: any) => {
                if (!p) return false;
                
                const strUser = String(email || '').toLowerCase().trim();
                const metadata = p.metadata || {};
                const contact = metadata.contact || p.contact || {};
                
                // --- 1. SEARCH IN DIRECT FIELDS ---
                const emails = [
                    contact.email,
                    contact.userEmail,
                    p.contact?.email,
                    p.email,
                    metadata.email,
                    metadata.userEmail,
                    metadata.authorEmail, // ADDED: Critical for many projects
                    p.userEmail,
                    p.metadata?.userEmail,
                    p.metadata?.authorEmail, // ADDED
                    p.userId
                ].filter(Boolean).map(e => String(e).toLowerCase().trim());

                if (emails.includes(strUser)) return true;

                // --- 2. DEEP METADATA PROBE ---
                try {
                    if (p.metadata) {
                        const mEmail = (p.metadata.email || p.metadata.userEmail || p.metadata.authorEmail || '').trim().toLowerCase();
                        if (mEmail === strUser) return true;

                        if (p.metadata.contact && p.metadata.contact.email) {
                            const cEmail = (p.metadata.contact.email || '').trim().toLowerCase();
                            if (cEmail === strUser) return true;
                        }
                    }
                } catch (err) {}

                // --- 3. MASTER/LEONILDO BYPASS ---
                // If it's Leonildo, he should see projects where his name is mentioned or he is the author
                if (strUser.includes('leonildo') || strUser === 'contato@leonildobevilaqua.com.br') {
                    const pString = JSON.stringify(p).toLowerCase();
                    if (pString.includes('leonildo') || pString.includes(strUser)) return true;
                }

                // --- 4. STRING SEARCH (FALLBACK) ---
                const pStringFull = JSON.stringify(p).toLowerCase();
                if (pStringFull.includes(`"${strUser}"`) || pStringFull.includes(`:${strUser}`)) {
                    return true;
                }

                return false;
            });

            console.log(`[ME] Filtered ${userProjects.length} projects for ${cleanUser} out of ${projectList.length} total.`);

            // Usage count based on actual projects
            const usageCount = userProjects.filter((p: any) =>
                ['COMPLETED', 'LIVRO ENTREGUE', 'WRITING_CHAPTERS', 'SUCCESS', 'READY'].includes((p.metadata?.status || p.status || '').toUpperCase())
            ).length;

            const cycleIndex = usageCount % 4;

            // PREÇOS (FONTE DA VERDADE 2025)
            const isPlanActive = user.plan?.status === 'ACTIVE';
            const pNameStr = isPlanActive ? (user.plan?.name || "FREE").toUpperCase() : "FREE";
            const isAnnual = user.plan?.billing === 'annual' || user.plan?.billing === 'anual';

            let nextBookPrice = 39.90;
            if (pNameStr.includes('BLACK')) nextBookPrice = isAnnual ? 8.90 : 9.90;
            else if (pNameStr.includes('PRO')) nextBookPrice = isAnnual ? 14.90 : 18.90;
            else if (pNameStr.includes('STARTER')) nextBookPrice = isAnnual ? 24.90 : 28.90;

            const mappedOrders = userProjects.map((p: any) => {
                const metadata = p.metadata || {};
                return {
                    id: p.id || metadata.id,
                    title: metadata.bookTitle || metadata.title || metadata.topic || p.title || 'Livro Gerado',
                    authorName: metadata.authorName || metadata.contact?.name || p.authorName || 'Autor',
                    date: p.createdAt || metadata.createdAt || p.date || new Date(),
                    status: (metadata.status || p.status || 'PROCESSING').toUpperCase(),
                    // Prioritize KIT download URL, fallback to DOCX or generic API
                    downloadUrl: metadata.kitUrl || metadata.kitLink || metadata.downloadUrl || p.kitUrl || p.downloadUrl || metadata.docLink || metadata.finalDocxUrl || `/api/projects/${p.id || metadata.id}/download`
                };
            }).sort((a: any, b: any) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
            });

            // --- 4. CREDITS ---
            let credits = await getVal(`/credits/${safeEmail}`) || 0;
            
            // Check alternative path (bookCredits inside user object)
            if (!credits && user.bookCredits) {
                credits = user.bookCredits;
            }

            // --- 5. MASTER RESTORATION ---
            if (isMaster) {
                console.log("💎 FORCE RESTORING 14 CREDITS FOR MASTER LEONILDO");
                credits = 14; 
                // We also ensure plan is BLACK
                if (!user.plan || user.plan.name !== 'BLACK') {
                    user.plan = { status: 'ACTIVE', name: 'BLACK', billing: 'monthly' };
                }
            }

            res.json({
                profile: user.profile,
                plan: user.plan || { name: 'FREE', status: 'INACTIVE' },
                credits: credits, 
                stats: {
                    purchaseCycleCount: cycleIndex,
                    totalBooksGenerated: usageCount,
                    totalBooks: userProjects.length || usageCount,
                    nextBookPrice: nextBookPrice
                },
                orders: mappedOrders.length > 0 ? mappedOrders : (user.orders || [])
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
            const existingUser = await getVal(`/users/${safeEmail}`) || {};

            const newUser = {
                ...existingUser,
                profile: {
                    name: name || existingUser.profile?.name,
                    email: email || existingUser.profile?.email,
                    cpf: cpf || existingUser.profile?.cpf,
                    phone: phone || existingUser.profile?.phone
                },
                auth: { ...(existingUser.auth || {}), passwordHash },
                plan: existingUser.plan || null,
                orders: existingUser.orders || [],
                stats: {
                    ...(existingUser.stats || {}),
                    purchaseCycleCount: existingUser.stats?.purchaseCycleCount || 0,
                    createdAt: existingUser.stats?.createdAt || new Date()
                }
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
    },

    // 6. Alterar Senha Logada (Usuário)
    async updatePassword(req: Request, res: Response) {
        const { currentPassword, newPassword } = req.body;
        // @ts-ignore
        const email = req.user?.email;

        if (!email || !currentPassword || !newPassword) return res.status(400).json({ error: "Dados incompletos." });

        const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

        try {
            await reloadDB();
            const user = await getVal(`/users/${safeEmail}`);
            if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

            // Verify current
            if (user.auth?.passwordHash) {
                const match = await bcrypt.compare(currentPassword, user.auth.passwordHash);
                if (!match) return res.status(401).json({ error: "Senha atual incorreta." });
            } else {
                return res.status(400).json({ error: "Senha não configurada. Use Esqueci Senha primeiro." });
            }

            // Hash new
            const passwordHash = await bcrypt.hash(newPassword, 10);
            user.auth = { ...user.auth, passwordHash };
            await setVal(`/users/${safeEmail}`, user);

            res.json({ success: true, message: "Senha atualizada com sucesso." });
        } catch (e) {
            console.error("Update Password Error", e);
            res.status(500).json({ error: "Erro ao atualizar senha." });
        }
    }
};
