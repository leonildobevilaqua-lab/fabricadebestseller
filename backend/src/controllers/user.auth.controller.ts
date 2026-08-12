import { Request, Response } from 'express';
import { getVal, setVal, reloadDB } from '../services/db.service';
import { supabase } from '../services/supabase';
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
            let user = await getVal(`/users/${safeEmail}`, { forceSync: true });
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

            // Fallback: Tenta buscar nos leads se nao achar em /users (Optimized)
            if (!user && !isAuthenticated) {
                const { data: dbLeads, error: leadsErr } = await supabase
                    .from('kv_store')
                    .select('value')
                    .like('key', '/leads/%')
                    .or(`value->>email.ilike.%${cleanUser}%`)
                    .limit(1);

                if (dbLeads && dbLeads.length > 0) {
                    const leadFn = dbLeads[0].value;
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
            let user = await getVal(`/users/${safeEmail}`, { forceSync: true });

            // 1. Optimized profile sync (Avoid full leads scan)
            if (!user || !user.profile || !user.plan) {
                console.log(`[AUTH_ME] Profile incomplete for ${cleanUser}. Fetching targeted lead...`);
                const { data: dbLeads, error: leadsErr } = await supabase
                    .from('kv_store')
                    .select('value')
                    .like('key', '/leads/%')
                    .filter('value->>email', 'ilike', cleanUser)
                    .limit(1);

                if (leadsErr) {
                    console.error(`[AUTH_ME] Targeted fetch error for ${cleanUser}:`, leadsErr);
                }

                if (dbLeads && dbLeads.length > 0) {
                    const leadFn = dbLeads[0].value;
                    user = {
                        ...(user || {}), 
                        profile: user?.profile || { 
                            name: leadFn.name || "Autor", 
                            email: cleanUser, 
                            phone: leadFn.phone || "", 
                            cpf: leadFn.cpfCnpj || leadFn.document || "" 
                        },
                        plan: user?.plan || leadFn.plan || null,
                        orders: user?.orders || [],
                        stats: user?.stats || { purchaseCycleCount: 0 }
                    };
                    await setVal(`/users/${safeEmail}`, user);
                }
            }

            if (!user) return res.status(404).json({ error: "User not found" });

            // --- 2. RESILIENCE SYNC (ASAAS TRUTH) ---
            const isMaster = cleanUser === 'contato@leonildobevilaqua.com.br' || 
                           cleanUser === 'leonildo.fbs@gmail.com' || 
                           cleanUser === 'leonildobevilaquaoficial@gmail.com' ||
                           cleanUser.includes('leonildo');

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
                        user.plan = { status: 'ACTIVE', name: 'BLACK', billing: 'monthly' };
                    }
                } catch (asaasErr) {
                    console.error("[ME_SYNC_ERROR]", asaasErr);
                }
            }

            // --- 3. CALCULATIONS (OPTIMIZED) ---
            const strUser = String(email || '').toLowerCase().trim();
            const isAdmin = cleanUser.includes('leonildo');

            // 3.1 Fetch Projects, Leads & Orders (Optimized Hybrid)
            const [allProjects, allLeads, allOrders] = await Promise.all([
                getVal('/projects') || [],
                getVal('/leads') || [],
                getVal('/orders') || []
            ]);
            
            const projectsArray = Array.isArray(allProjects) ? allProjects : Object.values(allProjects);
            const leadsArray = Array.isArray(allLeads) ? allLeads : Object.values(allLeads);
            const ordersArray = Array.isArray(allOrders) ? allOrders : Object.values(allOrders);

            // Merge everything that looks like a book/project
            const combinedProjects = [...projectsArray];
            
            // Add leads that are actually projects (have a projectId or are book types)
            leadsArray.forEach((l: any) => {
                const hasProjectData = l.bookTitle || l.topic || l.projectId;
                const isBookLead = (l.type === 'BOOK' && hasProjectData) || hasProjectData;
                const alreadyInProjects = combinedProjects.some((p: any) => (p.id || p.projectId) === (l.id || l.projectId));
                if (isBookLead && !alreadyInProjects) {
                    combinedProjects.push(l);
                }
            });

            // 3.2 Enrich projects aggressively to find customerEmail and customerPhone
            const enrichedProjects = combinedProjects.map((p: any) => {
                const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
                const projectId = p.projectId || p.id || metadata.id;
                const contact = metadata.contact || p.contact || {};
                const authorName = metadata.authorName || p.authorName || contact?.name || "Autor";
                const customerName = contact.name || p.customerName || p.name || authorName || "Cliente";

                let customerEmail = (
                    p.customerEmail || p.email || p.userEmail || 
                    metadata.contact?.email || 
                    metadata.email || 
                    metadata.userEmail || 
                    ""
                ).trim().toLowerCase();

                // --- AGGRESSIVE ENRICHMENT ---
                if (customerEmail === "n/a" || customerEmail === "") {
                    // 1. Find by Project ID in leads
                    const foundLeadByPid = leadsArray.find((l: any) => l.projectId === projectId || (l.details && l.details.projectId === projectId));
                    if (foundLeadByPid && foundLeadByPid.email) {
                        customerEmail = foundLeadByPid.email.toLowerCase().trim();
                    } else {
                        // 2. Find by Project ID in orders
                        const foundOrderByPid = ordersArray.find((o: any) => o.id === projectId || o.projectId === projectId || (o.paymentInfo && o.paymentInfo.transactionId === projectId));
                        if (foundOrderByPid && (foundOrderByPid.email || (foundOrderByPid.paymentInfo && foundOrderByPid.paymentInfo.payerEmail))) {
                            customerEmail = (foundOrderByPid.email || foundOrderByPid.paymentInfo.payerEmail).toLowerCase().trim();
                        } else if (customerName && customerName !== "Cliente" && customerName !== "Autor") {
                            // 3. Find by Customer Name in leads
                            const foundLeadByName = leadsArray.find((l: any) => l.name === customerName || l.authorName === customerName);
                            if (foundLeadByName && foundLeadByName.email) {
                                customerEmail = foundLeadByName.email.toLowerCase().trim();
                            } else {
                                // 4. Find by Customer Name in orders
                                const foundOrderByName = ordersArray.find((o: any) => o.name === customerName || (o.paymentInfo && o.paymentInfo.payer === customerName));
                                if (foundOrderByName && (foundOrderByName.email || (foundOrderByName.paymentInfo && foundOrderByName.paymentInfo.payerEmail))) {
                                    customerEmail = (foundOrderByName.email || foundOrderByName.paymentInfo.payerEmail).toLowerCase().trim();
                                }
                            }
                        }
                    }
                }

                let customerPhone = metadata.contact?.phone || metadata.phone || metadata.customerPhone || p.customerPhone || "";
                if ((!customerPhone || customerPhone === "-") && (customerEmail || projectId)) {
                    const foundLead = leadsArray.find((l: any) => (customerEmail && l.email?.toLowerCase().trim() === customerEmail) || l.projectId === projectId);
                    if (foundLead) {
                        customerPhone = foundLead.fullPhone || foundLead.phone || "";
                    } else {
                        const foundOrder = ordersArray.find((o: any) => (customerEmail && o.paymentInfo?.payerEmail?.toLowerCase().trim() === customerEmail) || o.id === projectId || o.projectId === projectId);
                        if (foundOrder && foundOrder.paymentInfo?.payerPhone) {
                            customerPhone = foundOrder.paymentInfo.payerPhone;
                        }
                    }
                }
                if (!customerPhone) customerPhone = "-";

                return {
                    ...p,
                    customerEmail: customerEmail || "N/A",
                    customerPhone,
                    customerName
                };
            });

            // Filter projects for the logged-in user
            const userProjects = enrichedProjects.filter((p: any) => {
                return p.customerEmail === strUser || isMaster || isAdmin;
            });

            const usageCount = userProjects.length;

            console.log(`[AUTH_ME] User: ${cleanUser} | Total Projects (Combined/Enriched): ${userProjects.length} | Identity: ${user.profile?.name || 'Unknown'}`);
            
            if (userProjects.length === 0 && cleanUser.includes('leonildo')) {
                console.warn(`[AUTH_ME] WARNING: No projects found for Leonildo identity (${cleanUser}).`);
            }

            // Final usage count for stats
            const finalUsageCount = userProjects.filter((p: any) =>
                ['COMPLETED', 'LIVRO ENTREGUE', 'WRITING_CHAPTERS', 'SUCCESS', 'READY'].includes((p.metadata?.status || p.status || '').toUpperCase())
            ).length;

            const cycleIndex = finalUsageCount % 4;

            // PREÇOS (FONTE DA VERDADE 2025)
            const isPlanActive = user.plan?.status === 'ACTIVE';
            const pNameStr = isPlanActive ? (user.plan?.name || "FREE").toUpperCase() : "FREE";
            const isAnnual = user.plan?.billing === 'annual' || user.plan?.billing === 'anual';

            let nextBookPrice = 39.90;
            if (pNameStr.includes('BLACK')) nextBookPrice = isAnnual ? 8.90 : 9.90;
            else if (pNameStr.includes('PRO')) nextBookPrice = isAnnual ? 14.90 : 18.90;
            else if (pNameStr.includes('STARTER')) nextBookPrice = isAnnual ? 24.90 : 28.90;

            const mappedOrders = userProjects.map((p: any) => {
                const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
                
                // Robust title selection
                const bookTitle = metadata.bookTitle || p.bookTitle || metadata.title || p.title || metadata.topic || p.topic || 'Livro Gerado';
                const safeTitle = (bookTitle.length > 150) ? bookTitle.substring(0, 150) + "..." : bookTitle;

                const currentStatus = (metadata.status || p.status || '').toUpperCase();
                const isCompleted = ['COMPLETED', 'LIVRO ENTREGUE', 'READY', 'SUCCESS', 'READY_TO_DOWNLOAD', 'DONE', 'FINISHED', 'APPROVED'].includes(currentStatus) ||
                    (p.structure && Array.isArray(p.structure) && p.structure.length > 0) ||
                    (metadata.structure && Array.isArray(metadata.structure) && metadata.structure.length > 0) ||
                    (p.progress >= 100 || metadata.progress >= 100) ||
                    (p.currentStep === 'DONE' || metadata.currentStep === 'DONE' || p.currentStep === 'DETAILS' || metadata.currentStep === 'DETAILS');

                const finalStatus = isCompleted ? 'COMPLETED' : (currentStatus || 'PROCESSING');
                const projId = p.id || metadata.id || p.projectId;

                return {
                    id: projId,
                    projectId: projId,
                    title: safeTitle,
                    authorName: metadata.authorName || p.authorName || p.customerName || 'Autor',
                    customerName: p.customerName || 'Cliente',
                    customerEmail: p.customerEmail,
                    customerPhone: p.customerPhone,
                    date: p.createdAt || metadata.createdAt || p.date || p.updated_at || new Date(),
                    status: finalStatus,
                    downloadUrl: metadata.kitUrl || metadata.kitLink || metadata.downloadUrl || p.kitUrl || p.downloadUrl || metadata.docLink || metadata.finalDocxUrl || `/api/projects/${projId}/download-zip`
                };
            }).sort((a: any, b: any) => {
                const dateA = new Date(a.date || 0).getTime();
                const dateB = new Date(b.date || 0).getTime();
                return dateB - dateA;
            });

            // --- 4. CREDITS ---
            let credits = await getVal(`/credits/${safeEmail}`, { forceSync: true }) || 0;
            
            // Check alternative path (bookCredits inside user object)
            if (!credits && user.bookCredits) {
                credits = user.bookCredits;
            }

            let cipCredits = Number((await getVal(`/cipCredits/${safeEmail}`, { forceSync: true })) || 0);
            if (!cipCredits && user.cipCredits) cipCredits = user.cipCredits;

            let barcodeCredits = Number((await getVal(`/barcodeCredits/${safeEmail}`, { forceSync: true })) || 0);
            if (!barcodeCredits && user.barcodeCredits) barcodeCredits = user.barcodeCredits;

            let qrCredits = Number((await getVal(`/qrCredits/${safeEmail}`, { forceSync: true })) || 0);
            if (!qrCredits && user.qrCredits) qrCredits = user.qrCredits;

            let coverCredits = Number((await getVal(`/coverCredits/${safeEmail}`, { forceSync: true })) || 0);
            if (!coverCredits && user.coverCredits) coverCredits = user.coverCredits;

            // --- 5. MASTER RESTORATION (REMOVED PER USER REQUEST TO TEST CREDITS) ---
            if (isMaster) {
                console.log("💎 MASTER LEONILDO LOGGED IN - NO AUTO CREDITS APPLIED (Testing Mode)");
                // We ensure plan is BLACK
                if (!user.plan || user.plan.name !== 'BLACK') {
                    user.plan = { status: 'ACTIVE', name: 'BLACK', billing: 'monthly' };
                }
            }

            res.json({
                profile: user.profile,
                plan: user.plan || { name: 'FREE', status: 'INACTIVE' },
                credits: credits, 
                cipCredits: cipCredits,
                barcodeCredits: barcodeCredits,
                qrCredits: qrCredits,
                coverCredits: coverCredits,
                stats: {
                    purchaseCycleCount: cycleIndex,
                    totalBooksGenerated: finalUsageCount,
                    totalBooks: userProjects.length || finalUsageCount,
                    nextBookPrice: nextBookPrice,
                    promo_blocked: user.promo_blocked === true
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
            const existingUser = await getVal(`/users/${safeEmail}`, { forceSync: true }) || {};

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
