import { Request, Response } from 'express';
import * as QueueService from '../services/queue.service';
import * as AIService from '../services/ai.service';
import * as DocService from '../services/doc.service';
import { TitleOption, BookProject } from '../types';
import { sendEmail } from '../services/email.service';
import { pushVal, getVal, setVal, reloadDB } from '../services/db.service';
import * as StorageService from '../services/storage.service';
import path from 'path';
import mammoth from 'mammoth';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { AsaasProvider } from '../services/asaas.provider';

const upload = multer();

export const create = async (req: Request, res: Response) => {
    const { authorName, topic, language, contact, contentStyle, writingTone, bookTitle, subTitle, isFiction, genre, characters } = req.body;
    try {
        const safeEmail = contact?.email ? contact.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_') : null;
        let isResuming = false;

        // RESUME LOGIC: Check if user already has an active project, UNLESS forcing new
        if (contact && contact.email && !req.body.forceNew) {
            const existing = await QueueService.getProjectByEmail(contact.email);
            // If exists and is NOT Failed/Completed, return it?
            if (existing && existing.metadata.status !== 'COMPLETED' && existing.metadata.status !== 'FAILED') {
                // BUG FIX: Ignore 'Diagramming' projects (Livro Pré-Escrito) if user is trying to create a new book (Generator)
                // Unless the new topic allows it (which it shouldn't if it's manual input)
                if (existing.metadata.topic === 'Livro Pré-Escrito' && topic !== 'Livro Pré-Escrito') {
                    console.log("Ignoring existing Diagramming project for new Book creation flow.");
                    // Do NOT return. Let it create a new one.
                } else {
                    console.log(`Resuming existing project ${existing.id} for ${contact.email}`);
                    // If IDLE, update metadata with new inputs?
                    if (existing.metadata.status === 'IDLE') {
                        await QueueService.updateMetadata(existing.id, { authorName, topic, language, contentStyle, writingTone, bookTitle, subTitle });
                        existing.metadata.authorName = authorName;
                        existing.metadata.topic = topic;
                    }
                    isResuming = true;
                    return res.json(existing);
                }
            }
        }

        // --- PAYMENT ENFORCEMENT ---
        // If we are NOT resuming an existing active project, we MUST consume a credit.

        // DEV BYPASS - DISABLED (STRICT MODE)
        const isLocal = false; // req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
        // if (isLocal) console.log(`[PROJECT] DEV MODE DETECTED: Bypassing Credit Check for ${authorName}`);

        if (!isResuming && safeEmail && !isLocal) {
            let credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

            // --- KIWIFY/ASAAS FAST-TRACK SYNC ---
            // If credits <= 0, try one last time to sync from raw orders/payments before denying
            if (credits <= 0) {
                console.log(`[PROJECT] Credits 0 for ${contact.email}, attempting fast-track sync (KIWIFY/ASAAS)...`);
                try {
                    const rawOrders = await getVal('/orders') || [];
                    const orders = Array.isArray(rawOrders) ? rawOrders : Object.values(rawOrders);
                    const userEmail = contact.email.toLowerCase().trim();

                    const confirmedOrders = orders.filter((o: any) =>
                        (o.paymentInfo?.provider === 'KIWIFY' || o.paymentInfo?.provider === 'ASAAS') &&
                        (o.status === 'paid' || o.order_status === 'approved' || o.order_status === 'completed' || o.paymentInfo?.status === 'CONFIRMED' || o.paymentInfo?.status === 'RECEIVED') &&
                        (o.paymentInfo?.payerEmail?.toLowerCase().trim() === userEmail || o.email?.toLowerCase().trim() === userEmail)
                    );

                    const redeemedIds = await getVal(`/users/${safeEmail}/redeemed_payments`) || [];

                    for (const order of confirmedOrders) {
                        const txId = order.paymentInfo?.transactionId || order.id || order.order_id;
                        if (!txId || redeemedIds.includes(txId)) continue;

                        const pName = (order.paymentInfo?.product || order.product_name || order.description || "").toLowerCase();
                        const isGen = pName.includes('livro') || pName.includes('geração') || pName.includes('geracao');

                        if (isGen || (order.paymentInfo?.amount || order.amount) >= 10) {
                            credits += 1;
                            await setVal(`/credits/${safeEmail}`, credits);
                            redeemedIds.push(txId);
                            await setVal(`/users/${safeEmail}/redeemed_payments`, redeemedIds);
                            console.log(`[PROJECT] Fast-track granted ${order.paymentInfo?.provider} credit to ${contact.email} during project creation.`);
                        }
                    }
                } catch (e) {
                    console.error("[PROJECT_FAST_TRACK_ERROR]", e);
                }
            }

            if (credits <= 0) {
                console.log(`[PROJECT] Denied creation for ${contact.email}: No credits. Creating PENDING lead.`);

                const actualUserPlan = await getVal(`/users/${safeEmail}/plan`);
                const resolvedPlan = actualUserPlan || contact.plan || null;

                // CREATE PENDING LEAD FOR ADMIN VISIBILITY
                try {
                    const rawLeads = await getVal('/leads') || [];
                    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

                    // Check if a PENDING book lead already exists to avoid duplicates
                    const hasPending = leads.some((l: any) =>
                        l.email?.toLowerCase().trim() === contact.email.toLowerCase().trim() &&
                        l.type === 'BOOK' &&
                        (l.status === 'PENDING' || l.status === 'WAITING_PAYMENT')
                    );

                    if (!hasPending) {
                        const newLead = {
                            id: uuidv4(),
                            email: contact.email,
                            name: authorName || 'Autor',
                            phone: contact.phone || '',
                            status: 'PENDING', // Waiting for Payment or Admin Release
                            type: 'BOOK',
                            topic: topic,
                            date: new Date(),
                            created_at: new Date(),
                            plan: resolvedPlan, // Capture REAL Plan for Correct Pricing in Admin
                            credits: 0
                        };
                        await pushVal('/leads', newLead);
                        console.log(`Created PENDING BOOK Lead for ${contact.email}`);
                    }
                } catch (e) {
                    console.error("Error creating pending lead:", e);
                }

                return res.status(402).json({ error: "Payment Required", code: "PAYMENT_REQUIRED" });
            }

            // Deduct Credit (Ensure we never go negative)
            const newTotal = Math.max(0, credits - 1);
            await setVal(`/credits/${safeEmail}`, newTotal);
            
            // Mirror to user profile for dashboard visibility
            const userProfile = await getVal(`/users/${safeEmail}`);
            if (userProfile) {
                userProfile.bookCredits = newTotal;
                await setVal(`/users/${safeEmail}`, userProfile);
            }

            console.log(`[PROJECT] Deducted 1 credit from ${contact.email}. Remaining: ${newTotal}`);
        }
        // ---------------------------

        const project = await QueueService.createProject({ authorName, topic, language, contact, contentStyle: genre || contentStyle, writingTone, bookTitle, subTitle, isFiction, genre, characters });

        // --- CRITICAL FIX: Ensure Lead Exists for Admin Panel Visibility & Separate Sub/Book ---
        if (contact && contact.email) {
            try {
                const rawLeads = await getVal('/leads') || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

                let leadIndex = -1;
                // Search backwards for latest BOOK lead
                for (let i = leads.length - 1; i >= 0; i--) {
                    const l = leads[i] as any;
                    // Match Email
                    if (l.email?.toLowerCase().trim() === contact.email.toLowerCase().trim()) {
                        // Match Type: Only update if it's a BOOK lead or VOUCHER. 
                        // Do NOT overwrite SUBSCRIPTION or SUBSCRIBER status rows.
                        if (l.type !== 'SUBSCRIPTION' && l.status !== 'SUBSCRIBER' && l.status !== 'SUBSCRIBER_PENDING') {
                            leadIndex = i;
                            break;
                        }
                    }
                }

                // --- REAL-TIME ADMIN SYNC ---
                const safeEmail = contact.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
                const userInDb = await getVal(`/users/${safeEmail}`);
                const currentPlan = userInDb?.plan || contact.plan || null;

                if (leadIndex !== -1) {
                    // Update existing BOOK Lead
                    await setVal(`/leads[${leadIndex}]`, {
                        ...(leads[leadIndex] as any),
                        status: 'IN_PROGRESS',
                        topic: topic,
                        name: authorName || (leads[leadIndex] as any).name,
                        date: new Date(), // Bring to top
                        projectId: project.id,
                        plan: currentPlan // Sync latest plan
                    });
                    console.log(`Updated existing Lead for Project ${project.id}`);
                } else {
                    // Create New Lead
                    const newLead = {
                        id: uuidv4(),
                        email: contact.email,
                        name: authorName || 'Autor',
                        phone: contact.phone || '',
                        status: 'IN_PROGRESS',
                        type: 'BOOK',
                        topic: topic,
                        date: new Date(),
                        created_at: new Date(),
                        plan: currentPlan,
                        projectId: project.id,
                        credits: 0
                    };
                    await pushVal('/leads', newLead);
                    console.log(`Created NEW Lead for Project ${project.id}`);
                }

            } catch (err) {
                console.error("Error creating/updating lead for project:", err);
            }
        }
        // ------------------------------------------------------------------

        // [ORDER RECONCILIATION - LINK PROJECT TO ORDER]
        if (!isResuming && safeEmail) {
            try {
                const userOrders: any[] = await getVal(`/users/${safeEmail}/orders`) || [];
                // Find oldest AVAILABLE credit
                // We look for 'CREDIT_AVAILABLE' which was created by Payment Controller
                let orderIndex = userOrders.findIndex((o: any) => o.status === 'CREDIT_AVAILABLE');

                // If no specific credit found, maybe use the oldest PAID one that isn't linked?
                // For now, stick to our new status.

                if (orderIndex !== -1) {
                    console.log(`[PROJECT] Linking Project ${project.id} to Order #${userOrders[orderIndex].id}`);

                    const updatedOrder = {
                        ...userOrders[orderIndex],
                        status: 'PROCESSING', // Now it's being used
                        title: topic || "Livro em Produção...", // Set initial topic as title
                        projectId: project.id // LINK IT!
                    };

                    await setVal(`/users/${safeEmail}/orders[${orderIndex}]`, updatedOrder);
                }
            } catch (e) {
                console.error("Failed to link Project to Order:", e);
            }
        }

        res.json(project);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};


export const get = async (req: Request, res: Response) => {
    const project = await QueueService.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
};

export const update = async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body; // Expect { metadata: { ... } } or partials

    try {
        if (updates.metadata) {
            await QueueService.updateMetadata(id, updates.metadata);
        }

        // --- TRIGGER DOCX GENERATION ON COMPLETION ---
        if (updates.metadata?.status === 'COMPLETED') {
            console.log(`Project ${id} marked COMPLETED. Generating final artifact...`);
            const fullProject = await QueueService.getProject(id);
            if (fullProject) {
                // Ensure structure is sorted/valid if needed?
                // Just generate.
                const artifactPath = await DocService.generateBookDocx(fullProject);
                console.log(`Final artifact generated for project ${id} at ${artifactPath}`);

                const userEmail = fullProject.metadata.contact?.email;
                if (userEmail) {
                    // AUTO-SEND EMAIL with Design
                    try {
                        await notifyUserBookReady(userEmail, fullProject.metadata.bookTitle || "Seu Livro", artifactPath);
                        console.log(`Auto-sent success email to ${userEmail}`);
                    } catch (emailErr) {
                        console.error("Failed to auto-send email:", emailErr);
                    }
                }
                if (userEmail) {
                    const rawLeads = await getVal('/leads') || [];
                    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                    // Find latest lead
                    let leadIndex = -1;
                    for (let i = leads.length - 1; i >= 0; i--) {
                        if ((leads[i] as any).email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
                            leadIndex = i;
                            break;
                        }
                    }
                    if (leadIndex !== -1) {
                        // Set status to "LIVRO ENTREGUE" as requested
                        await setVal(`/leads[${leadIndex}]/status`, 'LIVRO ENTREGUE');
                        console.log(`Updated Lead ${leadIndex} status to LIVRO ENTREGUE`);
                    }
                }
            }
        }

        // Add other fields if necessary
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const startResearch = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[startResearch] Initiating for Project ID: ${id}`);
    const { language, email: bodyEmail, titleInstruction } = req.body;
    const project = await QueueService.getProject(id);

    if (!project) {
        console.error(`[startResearch] Project ${id} NOT FOUND in QueueService.`);
        return res.status(404).json({ error: "Not found" });
    }

    // IDEMPOTENCY: If project is already running, don't restart or block.
    const pStatus = project.metadata.status as string;
    if (['RESEARCHING', 'WRITING_CHAPTERS', 'COMPLETED', 'LIVRO ENTREGUE'].includes(pStatus)) {
        console.log(`[startResearch] Project ${id} already active (${pStatus}). Skipping init.`);
        return res.json({ success: true, message: "Already active" });
    }

    const userEmail = project.metadata.contact?.email || bodyEmail;
    let hasAccess = false;
    let currentStatus = 'UNKNOWN';

    if (userEmail) {
        await reloadDB(); // Force sync to see Admin Approval

        // VIP BYPASS (Hotfix)
        if (userEmail.toLowerCase().includes('subevilaqua')) {
            hasAccess = true;
            currentStatus = 'VIP';
            console.log(`[VIP] Access Granted for ${userEmail}`);
        }

        // LOCALHOST BYPASS
        const isLocal = req.headers.host?.includes('localhost') || req.headers.host?.includes('127.0.0.1');
        if (isLocal) {
            hasAccess = true;
            console.log(`[startResearch] DEV MODE: Bypassing Payment Check for ${userEmail}`);
        }

        if (!hasAccess) {
            // [FIX] PROJECT-BASED ACCESS: If the project exists and is in IDLE state, 
            // the user ALREADY spent their credit to create it. We must let it start.
            if (project.metadata.status === 'IDLE' || project.metadata.status === 'WAITING_TITLE') {
                hasAccess = true;
                console.log(`[startResearch] Access Granted: Project ${id} is in ${project.metadata.status} state (Credit already spent).`);
            }
        }

        if (!hasAccess) {
            // 1. Check Unified Ledger Credits (Source of Truth)
            const safeEmail = (userEmail as string).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            let ledgerCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

            // Fallback to user object if root path is empty (Legacy support)
            if (!ledgerCredits) {
                const userObj = await getVal(`/users/${safeEmail}`);
                if (userObj?.bookCredits) ledgerCredits = Number(userObj.bookCredits);
            }

            if (ledgerCredits > 0) {
                hasAccess = true;
                // [FIX] Removed double deduction here. Credit is consumed only at project creation or manual administrative release.
                console.log(`[startResearch] Access Granted via Ledger Credits (${ledgerCredits} available).`);
            }

            // 2. Check Legacy Leads Status
            // 2. Check Legacy Leads Status (Robust)
            if (!hasAccess) {
                const rawLeads = await getVal('/leads') || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                const cleanUserEmail = userEmail.toLowerCase().trim();

                for (const l of leads as any[]) {
                    if (l.email?.toLowerCase().trim() === cleanUserEmail) {
                        currentStatus = l.status;
                        // Added PAID and loose check
                        if (['APPROVED', 'IN_PROGRESS', 'PAID', 'LIVRO ENTREGUE'].includes(l.status) || (l.credits || 0) > 0) {
                            hasAccess = true;
                            console.log(`[startResearch] Granted Access via Local Lead Status: ${l.status}`);
                            break;
                        }
                    }
                }
            }
        }

        // 3. EMERGENCY CHECK: VALIDATE RECENT PAYMENTS DIRECTLY FROM ASAAS (Last 24h)
            if (!hasAccess) {
                try {
                    console.log(`[startResearch] Validating Asaas for ${userEmail}...`);
                    const originalEmail = userEmail;
                    const cleanEmail = userEmail.toLowerCase().trim();
                    let customer = await AsaasProvider.getCustomerByEmail(originalEmail);

                    if (!customer && originalEmail !== cleanEmail) {
                        console.log(`[startResearch] Customer not found with ${originalEmail}, trying ${cleanEmail}...`);
                        customer = await AsaasProvider.getCustomerByEmail(cleanEmail);
                    }

                    if (customer) {
                        const payments = await AsaasProvider.getPayments({ customer: customer.id, limit: 50 });
                        if (payments && Array.isArray(payments)) {
                            console.log(`[startResearch] Found ${payments.length} payments for customer ${customer.id}`);

                            const recentPayment = payments.find((p: any) => {
                                console.log(`[PAYMENT CHECK] ID: ${p.id}, Status: ${p.status}, Date: ${p.dateCreated}`);

                                const pDate = new Date(p.dateCreated);
                                const diffMins = (new Date().getTime() - pDate.getTime()) / 60000;

                                // Relaxed Check
                                if (p.status === 'CONFIRMED' || p.status === 'RECEIVED') {
                                    return diffMins < 1440 * 2; // 48 Hours
                                }
                                // Allow PENDING if created recently (Assumes "Just Paid" latency or Sandbox lag)
                                if (p.status === 'PENDING' || p.status === 'AWAITING_PAYMENT') {
                                    return diffMins < 60; // 1 Hour Grace
                                }

                                return false;
                            });

                            if (recentPayment) {
                                hasAccess = true;
                                console.log(`[startResearch] SECURITY OVERRIDE: Found verified payment ${recentPayment.id}. Access Granted.`);
                            } else {
                                console.log(`[startResearch] No CONFIRMED/RECEIVED payment found in last 48h among 50 recent.`);
                            }
                        }
                    } else {
                        console.log(`[startResearch] Customer ABSOLUTELY NOT FOUND in Asaas for ${userEmail}`);
                    }
                } catch (asaasErr) {
                    console.error("[startResearch] Asaas Emergency Check Failed:", asaasErr);
                }
            }
        }

        // 4. KIWIFY/ASAAS FAST-TRACK (Final Attempt)
        if (!hasAccess) {
            try {
                const rawOrders = await getVal('/orders') || [];
                const orders = Array.isArray(rawOrders) ? rawOrders : Object.values(rawOrders);
                const userEmailLower = userEmail.toLowerCase().trim();
                const confirmedOrders = orders.filter((o: any) =>
                    (o.paymentInfo?.provider === 'KIWIFY' || o.paymentInfo?.provider === 'ASAAS') &&
                    (o.status === 'paid' || o.order_status === 'approved' || o.order_status === 'completed' || o.paymentInfo?.status === 'CONFIRMED' || o.paymentInfo?.status === 'RECEIVED') &&
                    (o.paymentInfo?.payerEmail?.toLowerCase().trim() === userEmailLower || o.email?.toLowerCase().trim() === userEmailLower)
                );

                const safeEmail = userEmailLower.replace(/[^a-zA-Z0-9]/g, '_');
                const redeemedIds = await getVal(`/users/${safeEmail}/redeemed_payments`) || [];

                for (const order of confirmedOrders) {
                    const txId = order.paymentInfo?.transactionId || order.id || order.order_id;
                    if (!txId || redeemedIds.includes(txId)) continue;

                    const pName = (order.paymentInfo?.product || order.product_name || order.description || "").toLowerCase();
                    const isGen = pName.includes('livro') || pName.includes('geração') || pName.includes('geracao');

                    if (isGen || (order.paymentInfo?.amount || order.amount) >= 10) {
                        hasAccess = true;
                        console.log(`[startResearch] Granted Access via ${order.paymentInfo?.provider} Fast-track for ${userEmail}`);
                        break;
                    }
                }
            } catch (e) { console.error("[startResearch] Fast-track error", e); }
        }

        if (!hasAccess) {
            console.warn(`[startResearch] BLOCKED ${userEmail}. Status: ${currentStatus}`);
            return res.status(402).json({
                error: "Você precisa adquirir um crédito ou aguardar a confirmação do pagamento para gerar este livro.",
                code: "PAYMENT_REQUIRED",
                details: `Email: ${userEmail}`
            });
        }
        const workerId = uuidv4();

    // 1. LOCK CHECK
    const now = Date.now();
    const lastPulse = project.metadata.lastWorkerPulse ? new Date(project.metadata.lastWorkerPulse).getTime() : 0;
    const isActuallyRunning = project.metadata.status === 'RESEARCHING' && (now - lastPulse < 30000);

    if (isActuallyRunning) {
        console.log(`[startResearch] Research already active for ${id}. Skipping.`);
        return res.json({ success: true, message: "Research already in progress", status: 'ACTIVE' });
    }

    // 2. TAKE OVER
    await QueueService.updateMetadata(id, {
        status: 'RESEARCHING',
        progress: project.metadata.progress || 1,
        statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
        language: language || project.metadata.language || 'pt',
        lastWorkerPulse: new Date().toISOString(),
        currentWorkerId: workerId
    });

    // --- UPDATE LEAD STATUS TO IN_PROGRESS ---
    try {
        const userEmail = project.metadata.contact?.email;
        if (userEmail) {
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            for (let i = leads.length - 1; i >= 0; i--) {
                if ((leads[i] as any).email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
                    await setVal(`/leads[${i}]/status`, 'IN_PROGRESS');
                    console.log(`Updated Lead status to IN_PROGRESS for ${userEmail}`);
                    break;
                }
            }
        }
    } catch (e) {
        console.error("Error updating lead status:", e);
    }

    // Respond to client IMMEDIATELY
    res.json({ message: "Research started", workerId });

    // Background Process
    (async () => {
        try {
            const targetLang = language || project.metadata.language || 'pt';
            
            // Check preemption helper
            const checkPreemption = async () => {
                const latest = await QueueService.getProject(id);
                if (!latest || latest.metadata.currentWorkerId !== workerId) {
                    throw new Error("PREEMPTED");
                }
                return latest;
            };

            const topic = project.metadata.topic;
            let currentProject = project;

            if (titleInstruction) {
                await QueueService.updateMetadata(id, {
                    progress: 28,
                    statusMessage: project.metadata.isFiction 
                        ? "🏗️ Refinando agora a estrutura narrativa e ganchos..." 
                        : "🏗️ Refinando agora a estrutura de títulos...",
                    lastWorkerPulse: new Date().toISOString()
                });

                const fullContext = project.researchContext || `TEMA: ${topic}`; 
                const titles = await AIService.generateTitleOptions(topic, fullContext, targetLang, titleInstruction, project.metadata.isFiction);
                
                currentProject = await checkPreemption();
                await QueueService.updateProject(id, { 
                    titleOptions: titles,
                    metadata: { ...currentProject.metadata, status: 'WAITING_TITLE', progress: 30, statusMessage: "✅ Novos títulos gerados.", lastWorkerPulse: new Date().toISOString() }
                });
                return;
            }

            // Step 1: YouTube
            let ytResearch = "";
            currentProject = await checkPreemption();
            const currentProgress = Number(currentProject.metadata.progress || 0);

            if (currentProgress < 12) {
                await QueueService.updateMetadata(id, {
                    progress: 5,
                    statusMessage: `🔍 Coletando insights virais no YouTube...`,
                    lastWorkerPulse: new Date().toISOString()
                });

                try {
                    ytResearch = await AIService.researchYoutube(topic, targetLang);
                } catch (ytError: any) {
                    ytResearch = "Pesquisa YouTube indisponível.";
                }
            } else {
                ytResearch = currentProject.researchContext?.split('### PESQUISA GOOGLE')[0] || "Dados processados.";
            }

            // Step 2: Google
            let googleResearch = "";
            currentProject = await checkPreemption();
            if (Number(currentProject.metadata.progress || 0) < 22) {
                await QueueService.updateMetadata(id, {
                    progress: 15,
                    statusMessage: `🔎 Pesquisando tendências no Google Search...`,
                    lastWorkerPulse: new Date().toISOString()
                });

                try {
                    googleResearch = await AIService.researchGoogle(topic, ytResearch, targetLang);
                } catch (googleError: any) {
                    googleResearch = "Google Search indisponível.";
                }
            } else {
                googleResearch = "Dados processados.";
            }

            // Step 3: Competitors
            let compResearch = "";
            currentProject = await checkPreemption();
            if (Number(currentProject.metadata.progress || 0) < 28) {
                await QueueService.updateMetadata(id, {
                    progress: 25,
                    statusMessage: `🏆 Analisando Best-Sellers e concorrência...`,
                    lastWorkerPulse: new Date().toISOString()
                });

                try {
                    compResearch = await AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);
                } catch (compError: any) {
                    compResearch = "Análise indisponível.";
                }

                currentProject = await checkPreemption();
                const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
                await QueueService.updateProject(id, { 
                    researchContext: fullContext,
                    metadata: { ...currentProject.metadata, lastWorkerPulse: new Date().toISOString() }
                });
            }

            // FINAL STEP: Titles
            currentProject = await checkPreemption();
            const isManualTitle = currentProject.metadata.bookTitle && currentProject.metadata.bookTitle.trim().length > 1;

            if (isManualTitle && currentProject.metadata.status !== 'WAITING_TITLE') {
                await QueueService.updateMetadata(id, {
                    status: 'GENERATING_STRUCTURE',
                    progress: 35,
                    statusMessage: "🏗️ Título detectado. Construindo estrutura...",
                    lastWorkerPulse: new Date().toISOString()
                });

                const structure = await AIService.generateStructure(
                    currentProject.metadata.bookTitle!, 
                    currentProject.metadata.subTitle || "", 
                    currentProject.researchContext || topic, 
                    targetLang, 
                    currentProject.metadata.contentStyle || 'Profissional'
                );

                currentProject = await checkPreemption();
                await QueueService.updateProject(id, { 
                    structure,
                    metadata: { ...currentProject.metadata, status: 'REVIEW_STRUCTURE', progress: 40, statusMessage: "Estrutura pronta.", lastWorkerPulse: new Date().toISOString() }
                });
                return;
            }

            await QueueService.updateMetadata(id, {
                progress: 28,
                statusMessage: "🏗️ Moldando títulos de alta conversão...",
                lastWorkerPulse: new Date().toISOString()
            });

            const titles = await AIService.generateTitleOptions(topic, currentProject.researchContext || topic, targetLang);
            
            currentProject = await checkPreemption();
            await QueueService.updateProject(id, { 
                titleOptions: titles,
                metadata: { ...currentProject.metadata, status: 'WAITING_TITLE', progress: 30, statusMessage: "✅ Pesquisa concluída!", lastWorkerPulse: new Date().toISOString() }
            });

        } catch (error: any) {
            if (error.message === 'PREEMPTED') return;
            console.error("Research Error:", error);
            await QueueService.updateMetadata(id, {
                status: 'FAILED',
                statusMessage: `⚠️ Falha na produção: ${error.message?.substring(0, 100)}... Redigitalizando...`
            });
        }
    })();
};

export const selectTitle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, subtitle } = req.body;

    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    await QueueService.updateMetadata(id, {
        bookTitle: title,
        title: title, // Explicitly set 'title' so it loads correctly in Dashboard orders
        subTitle: subtitle,
        status: 'GENERATING_STRUCTURE',
        progress: 35,
        statusMessage: "TÍTULO DO LIVRO ESCOLHIDO, INFORMAÇÕES ENCAMINHADAS PARA NOSSOS ESCRITORES PROFISSIONAIS."
    });

    // Update Lead and Order in JSON DB to show proper Title in Admin
    try {
        const userEmail = project.metadata.contact?.email;
        if (userEmail) {
            const safeEmail = userEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            // Find latest lead for this email
            let leadIndex = -1;
            for (let i = leads.length - 1; i >= 0; i--) {
                const l: any = leads[i];
                if (l.email?.toLowerCase().trim() === userEmail.toLowerCase().trim() && l.type === 'BOOK') {
                    leadIndex = i;
                    break;
                }
            }

            if (leadIndex !== -1) {
                await setVal(`/leads[${leadIndex}]/bookTitle`, title);
                await setVal(`/leads[${leadIndex}]/topic`, title); // Replace topic to clean up view
            }

            // Sync with /users/:email/orders if applicable
            const orders = (await getVal(`/users/${safeEmail}/orders`)) || [];
            if (Array.isArray(orders)) {
                const orderIndex = orders.findIndex(o => o.projectId === id);
                if (orderIndex !== -1) {
                    await setVal(`/users/${safeEmail}/orders[${orderIndex}]/title`, title);
                }
            }
        }
    } catch (e) {
        console.error("Failed to update Lead title:", e);
    }

    res.json({ message: "Title selected, generating structure..." });

    try {
        const lang = project.metadata.language || 'pt'; // Fallback
        const structure = await AIService.generateStructure(title, subtitle, project.researchContext, lang, project.metadata.genre || project.metadata.contentStyle, project.metadata.isFiction);
        await QueueService.updateProject(id, { structure });
        await QueueService.updateMetadata(id, {
            status: 'REVIEW_STRUCTURE', // New status for manual approval
            progress: 40,
            currentStep: 'REVIEW_STRUCTURE', // TS needs this to be valid
            statusMessage: "Estrutura pronta para aprovação."
        });
    } catch (error) {
        console.error("Background Research Error:", error);
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro ao gerar estrutura." });
    }
};

export const generateBookContent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { language } = req.body;
    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    const workerId = uuidv4();
    const targetLang = language || project.metadata.language || 'pt';

    // 1. LOCK CHECK: Prevent multiple workers from processing the same project
    const now = Date.now();
    const lastPulse = project.metadata.lastWorkerPulse ? new Date(project.metadata.lastWorkerPulse).getTime() : 0;
    const isActuallyRunning = project.metadata.status === 'WRITING_CHAPTERS' && (now - lastPulse < 30000); // 30s grace

    if (isActuallyRunning) {
        console.log(`[PROJECT] Generation already active for ${id} (Pulse: ${now - lastPulse}ms ago). Skipping new worker.`);
        return res.json({ message: "Content generation already in progress", status: 'ACTIVE' });
    }

    // 2. TAKE OVER / START
    await QueueService.updateMetadata(id, { 
        status: 'WRITING_CHAPTERS', 
        progress: project.metadata.progress || 41,
        lastWorkerPulse: new Date().toISOString(),
        currentWorkerId: workerId 
    });

    res.json({ message: "Content generation started", workerId });

    try {
        // We reload the project inside the loop to get the most fresh state
        let chapters = [...project.structure];
        const total = chapters.length;

        for (let i = 0; i < total; i++) {
            // RELOAD: Ensure we have the latest structure (maybe updated by a previous worker before crash)
            const freshProject = await QueueService.getProject(id);
            if (!freshProject) break;
            
            // CHECK LOCK: If someone else took over, we stop
            if (freshProject.metadata.currentWorkerId !== workerId) {
                console.log(`[PROJECT] Worker ${workerId} preempted by ${freshProject.metadata.currentWorkerId}. Stopping.`);
                return;
            }

            chapters = freshProject.structure;
            const chapter = chapters[i];

            // RESUME LOGIC: Skip if already generated
            if (chapter.isGenerated && chapter.content && chapter.content.length > 100) {
                console.log(`[PROJECT] Skipping Chapter ${chapter.id} (Already exists)`);
                continue;
            }

            // Update Pulse & Progress
            await QueueService.updateMetadata(id, {
                statusMessage: `Escrevendo Capítulo ${chapter.id}: ${chapter.title}...`,
                progress: 41 + Math.floor(((i) / total) * 40), // 41% to 81%
                lastWorkerPulse: new Date().toISOString()
            });

            // RETRY STRATEGY (3 Attempts)
            let success = false;
            let attempts = 0;
            while (!success && attempts < 3) {
                try {
                    attempts++;
                    const meta = { ...freshProject.metadata, language: targetLang };
                    const content = await AIService.writeChapter(meta, chapter, chapters, freshProject.researchContext);
                    
                    // RELOAD AGAIN before saving to be super safe
                    const latest = await QueueService.getProject(id);
                    if (latest && latest.metadata.currentWorkerId === workerId) {
                        latest.structure[i].content = content;
                        latest.structure[i].isGenerated = true;
                        await QueueService.updateProject(id, { 
                            structure: latest.structure,
                            metadata: { ...latest.metadata, lastWorkerPulse: new Date().toISOString() }
                        });
                    }
                    success = true;
                } catch (e: any) {
                    console.error(`Error writing chapter ${chapter.id} (Attempt ${attempts}/3):`, e);
                    if (attempts >= 3) {
                        const latest = await QueueService.getProject(id);
                        if (latest && latest.metadata.currentWorkerId === workerId) {
                           latest.structure[i].content = `[ERRO NA GERAÇÃO DESTE CAPÍTULO]\n\nTema: ${chapter.title}.\nSugerimos regenerar este trecho manualmente.`;
                           latest.structure[i].isGenerated = true; 
                           await QueueService.updateProject(id, { structure: latest.structure });
                        }
                        success = true; 
                    } else {
                        await new Promise(r => setTimeout(r, 2000));
                    }
                }
            }
        }

        // 2. Write Introduction (after chapters to be coherent)
        // Check if Intro exists (Chapter 0)
        let hasIntro = false;
        if (project.structure && project.structure.length > 0) {
            if (project.structure[0].id === 0 && project.structure[0].isGenerated) {
                hasIntro = true;
            }
        }

        if (!hasIntro) {
            await QueueService.updateMetadata(id, {
                status: 'WRITING_CHAPTERS',
                progress: 85,
                statusMessage: "Escrevendo a Introdução de alto impacto..."
            });

            let introContent = "";
            try {
                introContent = await AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);
            } catch (e) {
                console.error("Introduction Generation Failed:", e);
                introContent = "A Introdução não pôde ser gerada automaticamente devido a uma instabilidade na IA. Por favor, escreva uma introdução manualmente.";
            }

            const introChapter: any = { id: 0, title: "Introdução", content: introContent, isGenerated: true };

            if (!project.structure) project.structure = [];

            if (project.structure.length > 0 && project.structure[0].id !== 0) {
                project.structure.unshift(introChapter);
            } else {
                project.structure[0] = introChapter;
            }
            await QueueService.updateProject(id, { structure: project.structure });
        }

        // --- PAUSE POINT: Final Touches (Wait for User) ---
        // If not auto-generate, we stop here to let the user review and add toppings (Dedication, etc.)
        if (!project.metadata.autoGenerate) {
            console.log(`[PROJECT] Pausing for Final Touches (WAITING_DETAILS) for project ${id}`);
            await QueueService.updateMetadata(id, {
                status: 'WAITING_DETAILS',
                progress: 86,
                statusMessage: "🔨 Esboço pronto! Agora dê os toques finais de autoria para concluirmos..."
            });
            return; // DONE for now.
        }

        // --- AUTO-GEN FLOW (Background/Admin) ---
        // If auto-generate is TRUE, we generate extras automatically and proceed
        console.log("[PROJECT] Auto-generating Extras and proceeding...");
        try {
            const extras = await AIService.generateExtras(project.metadata, "", "", "", targetLang);
            await QueueService.updateMetadata(id, {
                dedication: extras.dedication,
                acknowledgments: extras.acknowledgments,
                aboutAuthor: extras.aboutAuthor
            });
        } catch (e) {
            console.warn("Auto-extras failed, using placeholders", e);
        }

        // Proceed to final steps
        await finalizeProjectLogic(id, targetLang);

    } catch (error) {
        console.error(error);
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro na geração do conteúdo." });
    }
};

/**
 * Perform final steps: Marketing Assets -> PDF/Docx -> Email
 */
async function finalizeProjectLogic(id: string, targetLang: string) {
    try {
        const project = await QueueService.getProject(id);
        if (!project) return;

        // 3. Marketing
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });

        try {
            const marketingAssets = await AIService.generateMarketing(
                project.metadata,
                project.researchContext,
                project.structure,
                targetLang
            );
            await QueueService.updateProject(id, { marketing: marketingAssets });
            console.log(`[PROJECT] Marketing assets generated for project ${id}`);
        } catch (e) {
            console.error("Failed to generate marketing assets:", e);
        }

        // 4. Content Finished
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 96,
            statusMessage: "Conteúdo do livro finalizado, livro encaminhado aos nossos agentes revisores."
        });

        await new Promise(r => setTimeout(r, 2000));

        // 5. Review
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 97,
            statusMessage: "REVISÃO CONCLUIDA, LIVRO LIBERADO PARA O SETOR DE DIAGRAMAÇÃO..."
        });

        await new Promise(r => setTimeout(r, 2000));

        // 6. Diagramming
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 98,
            statusMessage: "Processo de diagramação em andamento..."
        });

        await new Promise(r => setTimeout(r, 1000));

        // 7. Finalização e Geração de Arquivo
        await QueueService.updateMetadata(id, {
            status: 'COMPLETED',
            progress: 100,
            statusMessage: "DIAGRAMAÇÃO CONCLUIDA, LIVRO LIBERADO PARA DOWNLOAD DO CLIENTE..."
        });

        // BUG FIX: Chamar a geração do arquivo DOCX/ZIP ao finalizar
        console.log(`[PROJECT] Finalizing book ${id}. Generating files...`);
        const fullProject = await QueueService.getProject(id);
        if (fullProject) {
            const artifactPath = await DocService.generateBookDocx(fullProject);
            console.log(`[PROJECT] Files generated: ${artifactPath}`);

            // Notificar usuário por email
            if (fullProject.metadata.contact?.email) {
                try {
                    await notifyUserBookReady(fullProject.metadata.contact.email, fullProject.metadata.bookTitle || "Seu Livro", artifactPath);
                } catch (emailErr) {
                    console.error("Failed to send auto-email after generation:", emailErr);
                }
            }
        }
    } catch (err: any) {
        console.error("Finalize Logic Error:", err);
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: `Erro na finalização: ${err.message}` });
    }
}

export const finalizeBookContent = async (req: Request, res: Response) => {
    const { id } = req.params;
    let { dedication, acknowledgments, aboutAuthor, language } = req.body;

    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    try {
        const targetLang = language || project.metadata.language || 'pt';

        // --- BACKWARD COMPATIBILITY / AUTO-FILL ---
        // If the fields are empty, the user expects the AI to generate them 
        // using the topic and author name as context.
        if (!dedication || !acknowledgments || !aboutAuthor) {
            console.log(`[PROJECT] Partial empty extras for ${id}. Auto-generating missing sections...`);
            try {
                const extras = await AIService.generateExtras(project.metadata, "", "", "", targetLang);
                if (!dedication) dedication = extras.dedication;
                if (!acknowledgments) acknowledgments = extras.acknowledgments;
                if (!aboutAuthor) aboutAuthor = extras.aboutAuthor;
            } catch (e) {
                console.warn("Finalize Auto-extras failed", e);
            }
        }

        // 1. Save final details
        await QueueService.updateMetadata(id, {
            dedication,
            acknowledgments,
            aboutAuthor,
            status: 'GENERATING_MARKETING' as any,
            progress: 88,
            statusMessage: "Dados de autoria recebidos. Iniciando finalização..."
        });

        // 2. Response immediate
        res.json({ success: true, message: "Finalização iniciada" });

        // 3. Proceed with background logic
        finalizeProjectLogic(id, targetLang);

    } catch (error: any) {
        console.error("Finalize Controller Error:", error);
        res.status(500).json({ error: error.message });
    }
};


async function notifyUserBookReady(email: string, bookTitle: string, filePath: string) {
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
        console.error("File not found for email:", filePath);
        return;
    }

    const filename = require('path').basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);

    // In production this should be the PUBLIC_URL.
    const API_URL = process.env.API_URL || process.env.VITE_API_URL || 'https://api.fabricadebestseller.com.br';
    const downloadLink = `${API_URL}/downloads/${filename}`;

    const htmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; padding: 40px 20px; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background-color: #4F46E5; padding: 30px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Seu Livro Está Pronto! 📚</h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">Olá,</p>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 20px;">
                    Temos o prazer de informar que seu livro <strong>"${bookTitle}"</strong> foi finalizado com sucesso.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 30px;">
                    Ele passou por todas as etapas de nossa inteligência artificial, revisão e diagramação, e agora está pronto para ser lançado ao mundo.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${downloadLink}" style="background-color: #10B981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.2s;">
                        ⬇️ Baixar Livro Agora
                    </a>
                </div>

                <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 0;">
                    O arquivo também foi anexado a este e-mail para sua conveniência.
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                    &copy; ${new Date().getFullYear()} Fábrica de Best Sellers - Editora 360 Express<br>
                    Transformando ideias em livros.
                </p>
            </div>
        </div>
    </div>
    `;

    await sendEmail(
        email,
        `Seu Livro "${bookTitle}" Está Pronto! - Editora 360 Express`,
        `Seu livro ${bookTitle} está pronto! Faça o download no anexo.`, // Fallback text
        [{ filename: filename, content: fileBuffer }],
        htmlContent
    );
};

export const sendBookEmail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File required" });
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        console.log(`Sending email to ${email} for project ${id}`);

        // Save file locally logic preserved
        const fs = require('fs');
        const path = require('path');
        const savePath = path.join(__dirname, '../../generated_books');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, { recursive: true });

        const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fullPath = path.join(savePath, `book_${safeEmail}.docx`);
        fs.writeFileSync(fullPath, file.buffer);

        // Notify
        await notifyUserBookReady(email, "Seu Livro", fullPath);

        res.json({ success: true });
    } catch (error: any) {
        console.error("Email Error:", error);
        res.status(500).json({ error: error.message });
    }
};


export const generateExtras = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { dedicationTo, ackTo, aboutAuthorContext, language } = req.body;

    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    try {
        const lang = language || project.metadata.language || 'pt';
        const extras = await AIService.generateExtras(project.metadata, dedicationTo, ackTo, aboutAuthorContext, lang);
        res.json(extras);
    } catch (error: any) {
        console.error("Error generating extras:", error);
        res.status(500).json({ error: error.message });
    }
};


// Imports moved to top


export const uploadExistingBook = async (req: Request, res: Response) => {
    const { name, email, phone } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File required" });

    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const timestamp = Date.now();
        const safeName = (name || 'user').replace(/[^a-z0-9]/gi, '_');
        const ext = path.extname(file.originalname);
        const filename = `${timestamp}_${safeName}${ext}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, file.buffer);

        // 2. Create Lead in JSON DB
        const id = timestamp.toString();
        const lead = {
            id,
            name,
            email,
            phone,
            type: 'DIAGRAMMING',
            status: 'PENDING',
            date: new Date(),
            details: { filePath, originalName: file.originalname } // Local path
        };

        await pushVal('/leads', lead);

        res.json({ success: true, message: "Livro enviado para análise." });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
};

export const processDiagramLead = async (req: Request, res: Response) => {
    const { leadId } = req.body;

    // 1. Get Lead from JSON DB
    const rawLeads = await getVal('/leads') || [];
    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

    let leadIndex = -1;
    let lead: any = null;

    for (let i = 0; i < leads.length; i++) {
        if ((leads[i] as any).id === leadId) {
            leadIndex = i;
            lead = leads[i];
            break;
        }
    }

    // If no file, check if it's an AI Generation Lead (Type BOOK)
    if ((!lead.details?.filePath) && lead.topic) {
        // --- AI GENERATION FLOW ---
        try {
            // Update Status
            await setVal(`/leads[${leadIndex}]/status`, 'APPROVED');
            await setVal(`/leads[${leadIndex}]/productionStatus`, 'IN_PROGRESS'); // UI indicator

            res.json({ success: true, message: "Fábrica iniciada! Geração do livro começou." });

            (async () => {
                try {
                    console.log(`[Admin] Force-starting AI Generation for ${lead.email}`);

                    // 1. Create Project
                    const project = await QueueService.createProject({
                        authorName: lead.authorName || lead.name || "Autor Desconhecido",
                        topic: lead.topic,
                        language: 'pt', // Default to PT for admin force start
                        contact: { name: lead.name, email: lead.email, phone: lead.fullPhone || lead.phone }
                    });

                    // Update Lead
                    await setVal(`/leads[${leadIndex}]/projectId`, project.id);
                    await setVal(`/leads[${leadIndex}]/productionStatus`, 'RESEARCHING');

                    // Set Auto-Generate Flag for Frontend to auto-advance
                    await setVal(`/projects/${project.id}/metadata/autoGenerate`, true);

                    // 2. Start Research (Async)
                    // We call the controller logic directly or via API? 
                    // Better to call QueueService if available, or just reuse the logic from startResearch.
                    // Since startResearch is a Controller method, we might need to simulate it or extract logic.
                    // To keep it simple, we use the API via internal fetch or direct service call if possible.
                    // But here we are in the controller.

                    // Let's call startResearch logic manually using QueueService/AIService
                    console.log(`[Admin] Project Created ${project.id}. Starting Research...`);

                    // Trigger Research
                    await performResearch(project.id, 'pt');

                    // The chain (Research -> Structure -> Content) is usually event-driven or chained in frontend?
                    // actually, generateResearch updates status to RESEARCH_COMPLETED.
                    // Who triggers the next step?
                    // In `Generator.tsx`, frontend polls and triggers next steps.
                    // IF the user is not online, we need a "Auto-Drive" mode.
                    // Implemented 'Turbo Mode' or 'Auto-Advance' in Backend?
                    // Currently the backend stops after Research.
                    // WE NEED TO CHAIN IT HERE for "SEM PARAR".

                    // Chain: Research -> Select Title (Pick first) -> Generate Structure -> Generate Content
                    // This is complex to do in one go without a workflow engine.
                    // BUT for now, let's at least START the project so the User (Frontend) picks it up.
                    // If the User logs in, Generator.tsx will see status 'RESEARCH_COMPLETED' and might wait for user input (Title).
                    // If we want "Sem Parar", we might need to auto-select title?

                    // For now, let's just START RESEARCH. The User Frontend will pick up the rest.
                    // If the user meant "Fully Automated Background Generation", we'd need more logic.
                    // But "Começar a produzir" usually means "Start the process".

                } catch (err) {
                    console.error("[Admin] AI Generation Error", err);
                    await setVal(`/leads[${leadIndex}]/productionStatus`, 'FAILED');
                }
            })();

        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
        return;
    }

    if (!lead || !lead.details?.filePath) return res.status(404).json({ error: "Lead or file not found" });

    // RESPONSE IMMEDIATE (Existing File Logic)
    try {
        // Update Lead Status to APPROVED immediately to unblock UI
        await setVal(`/leads[${leadIndex}]/status`, 'APPROVED');

        // Respond to Admin/Webhook
        res.json({ success: true, message: "Processamento iniciado em segundo plano." });

        // --- BACKGROUND PROCESSING ---
        // We use a self-executing async function or just don't await the promise
        (async () => {
            try {
                console.log(`Starting background diagramming for lead ${lead.id}`);

                // 2. Read File
                const filePath = lead.details.filePath;
                // Check if it is a URL or local path (legacy)
                let rawText = "";

                let fileBuffer: Buffer | null = null;
                const fs = require('fs');
                if (filePath.startsWith('http')) {
                    fileBuffer = await StorageService.downloadFile(filePath);
                } else {
                    if (fs.existsSync(filePath)) {
                        fileBuffer = fs.readFileSync(filePath);
                    }
                }

                if (!fileBuffer) {
                    throw new Error("Could not retrieve file content from storage.");
                }

                const ext = path.extname(lead.details.originalName || filePath).toLowerCase(); // Use original name for extension if possible

                if (ext === '.docx') {
                    const result = await mammoth.extractRawText({ buffer: fileBuffer });
                    rawText = result.value;
                } else if (ext === '.txt' || ext === '.md') {
                    rawText = fileBuffer.toString('utf-8');
                } else {
                    throw new Error(`Formato de arquivo não suportado para diagramação automática: ${ext}. Por favor envie .docx ou .txt`);
                }

                console.log(`[Diagramming] Extracted text length: ${rawText.length}`);

                if (!rawText || rawText.trim().length < 100) {
                    throw new Error("Não foi possível extrair texto suficiente do arquivo. Verifique se o arquivo não está corrompido ou se é uma imagem.");
                }

                // 3. Structure Content
                const structure = await AIService.structureBookFromText(rawText);

                // Safety Check: Did AI return ANY structure?
                if (!structure || !structure.structure || structure.structure.length === 0) {
                    // Fallback: Treat whole text as one chapter?
                    // Or just error out.
                    console.error("[Diagramming] AI failed to structure content.");
                    throw new Error("A IA não conseguiu identificar capítulos no texto fornecido.");
                }

                console.log(`[Diagramming] AI Structure result: Success | Chapters: ${structure.structure.length}`);

                // 4. Create Project
                const project = await QueueService.createProject({
                    authorName: structure.metadata?.authorName || lead.name,
                    topic: structure.metadata?.topic || "Livro Pré-Escrito",
                    language: 'pt',
                    contact: { name: lead.name, email: lead.email, phone: lead.phone }
                });

                // 5. Populate Project
                project.metadata.bookTitle = structure.metadata?.bookTitle || "Título Desconhecido";
                project.metadata.subTitle = structure.metadata?.subTitle || "";
                project.metadata.status = 'WAITING_DETAILS';
                project.metadata.progress = 100;
                project.structure = structure.structure || [];

                // Ensure structure has valid IDs
                if (project.structure && !project.structure.every((c: any) => c.id)) {
                    project.structure = project.structure.map((c: any, i: number) => ({ ...c, id: i + 1 }));
                }

                project.metadata.statusMessage = "Livro estruturado e pronto para diagramação.";
                project.metadata.dedication = "";
                project.metadata.acknowledgments = "";
                project.metadata.aboutAuthor = ""; // Don't put intro here

                // Add Intro as Chapter 0 if exists
                if (structure.introduction) {
                    project.structure.unshift({
                        id: 0,
                        title: "Introdução",
                        content: structure.introduction,
                        summary: "Introdução do livro",
                        isCompleted: true,
                        isGenerated: true
                    });
                }

                await QueueService.updateProject(project.id, {
                    structure: project.structure,
                    metadata: project.metadata
                });

                // 6. Generate DOCX
                const artifactPath = await DocService.generateBookDocx(project);

                // Update Status to COMPLETED
                await QueueService.updateMetadata(project.id, { 
                    status: 'COMPLETED', 
                    progress: 100,
                    statusMessage: "Livro diagramado com sucesso!"
                });

                // Notify User
                if (project.metadata.contact?.email) {
                    try {
                        await notifyUserBookReady(project.metadata.contact.email, project.metadata.bookTitle || "Seu Livro", artifactPath);
                    } catch (emailErr) {
                        console.error("Failed to send auto-email for diagram lead:", emailErr);
                    }
                }

                // Update Project ID in Lead (Status is already Approved)
                await setVal(`/leads[${leadIndex}]/projectId`, project.id);

                console.log(`Background diagramming complete for lead ${lead.id}, Project: ${project.id}`);

            } catch (bgError: any) {
                console.error("Background Diagram Error:", bgError);
                // Update Logic: Set error on Metadata or Lead so user knows?
                // Currently no UI for error details on lead.
                // At least preventing the "Wrong Book" is better than delivering garbage.
            }
        })();

    } catch (e: any) {
        console.error("Immediate Response Error:", e);
        if (!res.headersSent) res.status(500).json({ error: e.message });
    }
};

export const regenerateDocx = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const project = await QueueService.getProject(id);
        if (!project) {
            console.error(`Regenerate: Project ID ${id} NOT found.`);
            return res.status(404).json({ error: "Project not found" });
        }

        console.log(`Regenerating DOCX for Project: ${project.id}. Title: ${project.metadata.bookTitle}. Chapters: ${project.structure?.length || 0}`);

        let targetProject = project;

        // Fallback Logic Removed: Do NOT swap project context implicitly.
        if (!targetProject.structure || targetProject.structure.length === 0) {
            console.warn(`Project ${id} structure is empty. Proceeding anyway (may generate empty doc).`);
        }

        console.log(`Generating DOCX using Project ID: ${targetProject.id}`);
        await DocService.generateBookDocx(targetProject);

        res.json({ success: true, message: "Docx regenerado com sucesso" });
    } catch (e: any) {
        console.error("Regenerate DOCX Error:", e);
        res.status(500).json({ error: e.message });
    }
};

export const findIdByEmail = async (req: Request, res: Response) => {
    const { email } = req.body;
    console.log(`Find ID by Email requested for: ${email}`);
    try {
        const project = await QueueService.getProjectByEmail(email);
        if (project) {
            console.log(`Found Project ID: ${project.id} for email ${email}. Title: ${project.metadata.bookTitle}`);
            res.json({ id: project.id });
        } else {
            console.log(`No valid project found for email ${email}`);
            res.json({ id: null });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

// --- TRANSLATION FEATURE ---
export const translateBook = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetLang } = req.body; // 'en', 'es', 'pt'

    if (!['en', 'es', 'pt'].includes(targetLang)) {
        return res.status(400).json({ error: "Idioma inválido." });
    }

    try {
        const project = (await getVal(`/projects/${id}`)) as BookProject;
        if (!project || !project.structure) {
            return res.status(404).json({ error: "Projeto não encontrado ou sem conteúdo gerado." });
        }

        // Check if already translating
        const translations = project.metadata.translations || {};
        const currentTrans = translations[targetLang];

        if (currentTrans?.status === 'IN_PROGRESS') {
            return res.json({ success: true, message: "Tradução em andamento.", status: 'IN_PROGRESS' });
        }
        if (currentTrans?.status === 'COMPLETED') {
            return res.json({ success: true, message: "Tradução já concluída.", status: 'COMPLETED' });
        }

        // Set status to IN_PROGRESS
        const newTranslations = {
            ...translations,
            [targetLang]: { status: 'IN_PROGRESS', progress: 0 }
        };
        await setVal(`/projects/${id}/metadata/translations`, newTranslations);

        res.json({ success: true, message: "Tradução iniciada." });

        // --- BACKGROUND TRANSLATION SIMULATION (Replace with Real AI later) ---
        (async () => {
            try {
                // Simulate processing time per chapter
                const totalChapters = project.structure.length;
                const translatedStructure = [];

                for (let i = 0; i < totalChapters; i++) {
                    const chapter = project.structure[i];

                    // Simulate AI Translation Delay
                    await new Promise(r => setTimeout(r, 2000));

                    // Mock Translation Logic
                    let suffix = targetLang === 'en' ? ' (English)' : targetLang === 'es' ? ' (Español)' : ' (Português)';
                    translatedStructure.push({
                        ...chapter,
                        title: chapter.title + suffix,
                        content: `[Translated Content to ${targetLang}]\n\n` + chapter.content
                    });

                    // Update Progress
                    const p = Math.round(((i + 1) / totalChapters) * 100);
                    await setVal(`/projects/${id}/metadata/translations/${targetLang}/progress`, p);
                }

                // MARK COMPLETED
                const finalTranslations = (await getVal(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = {
                    status: 'COMPLETED',
                    structure: translatedStructure
                };

                await setVal(`/projects/${id}/metadata/translations`, finalTranslations);

                console.log(`Translation to ${targetLang} completed for project ${id}`);

            } catch (err) {
                console.error("Translation Error:", err);
                const finalTranslations = (await getVal(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = { status: 'FAILED' };
                await setVal(`/projects/${id}/metadata/translations`, finalTranslations);
            }
        })();

    } catch (e: any) {
        console.error(e);
        // Avoid sending response again if already sent
    }
};

// --- HELPER: Perform Research (Logic extracted from startResearch) ---
const performResearch = async (projectId: string, language: string) => {
    try {
        const project = await QueueService.getProject(projectId);
        if (!project) return;
        const id = projectId;

        // Update status and ensure language is in metadata (even if in-memory)
        await QueueService.updateMetadata(id, {
            status: 'RESEARCHING',
            progress: 1,
            statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
            language: language || project.metadata.language || 'pt'
        });

        const topic = project.metadata.topic;
        const targetLang = language || project.metadata.language || 'pt';

        // Step 1: YouTube
        await QueueService.updateMetadata(id, {
            progress: 5,
            statusMessage: `📡 Calibrando sensores para varredura no YouTube: "${topic}"...`
        });
        let ytResearch = "";
        try {
            ytResearch = await AIService.researchYoutube(topic, targetLang);
        } catch (ytError: any) {
            console.error("YouTube Research Failed:", ytError);
        }

        await QueueService.updateMetadata(id, {
            progress: 12,
            statusMessage: `⚙️ Processando dados brutos e extraindo insights...`
        });

        // Step 2: Google
        await QueueService.updateMetadata(id, {
            progress: 15,
            statusMessage: `🔍 Iniciando mineração profunda no Google Search...`
        });
        const googleResearch = await AIService.researchGoogle(topic, ytResearch, targetLang);

        await QueueService.updateMetadata(id, {
            progress: 22,
            statusMessage: `📊 Refinando minério de dados...`
        });

        // Step 3: Competitors
        await QueueService.updateMetadata(id, {
            progress: 25,
            statusMessage: `🏆 Analisando Best-Sellers atuais...`
        });
        const compResearch = await AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);

        const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
        await QueueService.updateProject(id, { researchContext: fullContext });

        // Auto-proceed to Titles
        await QueueService.updateMetadata(id, {
            progress: 28,
            statusMessage: "🏗️ Moldando estruturas de títulos..."
        });

        const titles = await AIService.generateTitleOptions(topic, fullContext, targetLang, undefined, project.metadata.isFiction);
        await QueueService.updateProject(id, { titleOptions: titles });

        await QueueService.updateMetadata(id, {
            status: 'WAITING_TITLE',
            progress: 30,
            statusMessage: "✅ Pesquisa concluída. Matéria-prima pronta para seleção."
        });

        console.log(`[Research] Completed for project ${id}`);

    } catch (e) {
        console.error("PerformResearch Error:", e);
        await QueueService.updateMetadata(projectId, { status: 'FAILED', statusMessage: "Falha na pesquisa." });
    }
};

// --- DELETE PROJECT ---
export const remove = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const project = await QueueService.getProject(id);

        if (!project) return res.status(404).json({ error: "Projeto não encontrado." });

        // Remover do banco
        await setVal(`/projects/${id}`, null);

        // Remover da lista geral de leads/orders associados se aplicável
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
        const leadIndex = leads.findIndex((l: any) => l.projectId === id);
        if (leadIndex !== -1) {
            await setVal(`/leads[${leadIndex}]/status`, 'DELETED');
        }

        console.log(`[PROJECT] Projeto ${id} deletado com sucesso.`);
        res.json({ success: true, message: "Projeto excluído com sucesso." });

    } catch (error: any) {
        console.error("[PROJECT] Erro ao deletar projeto:", error);
        res.status(500).json({ error: "Erro interno ao excluir o projeto." });
    }
};

export const downloadProjectBook = async (req: Request, res: Response) => {
    const { id } = req.params;
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');

    try {
        if (!fs.existsSync(outputDir)) {
            try { fs.mkdirSync(outputDir, { recursive: true }); } catch (err) { }
        }

        let files = fs.readdirSync(outputDir);

        // PRIORITY: ZIP (Kit Completo) then DOCX
        let zipFile = files.find((f: string) => f.includes(id) && f.endsWith('.zip'));
        let docFile = files.find((f: string) => f.includes(id) && f.endsWith('.docx'));

        // REGENERATION FALLBACK: Se o arquivo não existir fisicamente, tentamos gerar agora (On-the-fly)
        if (!zipFile && !docFile) {
            console.log(`[DOWNLOAD] Arquivo não encontrado para o projeto ${id}. Tentando regeneração automática...`);
            const project = await QueueService.getProject(id);
            
            // Gerar se o projeto estiver em um estado "finalizado"
            if (project && (project.metadata.status === 'COMPLETED' || project.metadata.status === 'LIVRO ENTREGUE' || project.metadata.status === 'WAITING_DETAILS')) {
                try {
                    await DocService.generateBookDocx(project);
                    // Re-lê o diretório após a geração
                    files = fs.readdirSync(outputDir);
                    zipFile = files.find((f: string) => f.includes(id) && f.endsWith('.zip'));
                    docFile = files.find((f: string) => f.includes(id) && f.endsWith('.docx'));
                } catch (genErr) {
                    console.error(`[DOWNLOAD] Erro na regeneração automática para ${id}:`, genErr);
                }
            }
        }

        if (zipFile) {
            console.log(`[PROJECT] Serving ZIP (Kit) for project ${id}: ${zipFile}`);
            return res.download(path.join(outputDir, zipFile));
        }

        if (docFile) {
            console.log(`[PROJECT] Serving DOCX for project ${id}: ${docFile}`);
            return res.download(path.join(outputDir, docFile));
        }
    } catch (e) {
        console.error("Error serving project book", e);
    }

    res.status(404).json({ error: "Arquivo (ZIP ou DOCX) não encontrado para este projeto." });
};

export const downloadProjectZip = async (req: Request, res: Response) => {
    const { id } = req.params;
    const fs = require('fs');
    const path = require('path');
    const outputDir = path.join(__dirname, '../../generated_books');

    try {
        if (!fs.existsSync(outputDir)) {
            try { fs.mkdirSync(outputDir, { recursive: true }); } catch (err) { }
        }

        let files = fs.readdirSync(outputDir);
        let zipFile = files.find((f: string) => f.includes(id) && f.endsWith('.zip'));

        if (!zipFile) {
            console.log(`[ZIP-DOWNLOAD] ZIP não encontrado para o projeto ${id}. Tentando regeneração automática...`);
            const project = await QueueService.getProject(id);
            if (project && (project.metadata.status === 'COMPLETED' || project.metadata.status === 'LIVRO ENTREGUE' || project.metadata.status === 'WAITING_DETAILS')) {
                try {
                    await DocService.generateBookDocx(project);
                    files = fs.readdirSync(outputDir);
                    zipFile = files.find((f: string) => f.includes(id) && f.endsWith('.zip'));
                } catch (genErr) {
                    console.error(`[ZIP-DOWNLOAD] Erro na regeneração automática para ${id}:`, genErr);
                }
            }
        }

        if (zipFile) {
            console.log(`[PROJECT] Serving ZIP: ${zipFile}`);
            return res.download(path.join(outputDir, zipFile));
        }
    } catch (e) {
        console.error("Error serving project zip", e);
    }

    res.status(404).json({ error: "Arquivo ZIP não encontrado para este projeto." });
};

