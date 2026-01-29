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

const upload = multer();

export const create = async (req: Request, res: Response) => {
    const { authorName, topic, language, contact } = req.body;
    try {
        const safeEmail = contact?.email ? contact.email.toLowerCase().trim().replace(/\./g, '_') : null;
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
                        await QueueService.updateMetadata(existing.id, { authorName, topic, language });
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
        if (!isResuming && safeEmail) {
            const credits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

            // Check for any manually APPROVED leads (Voucher/Manual) that haven't been consumed?
            // For now, we rely on 'credits'. 
            // If the user paid, the webhook added a credit. 
            // If admin approved 'CREDIT', it added a credit.

            if (credits <= 0) {
                console.log(`[PROJECT] Denied creation for ${contact.email}: No credits. Creating PENDING lead.`);

                // FORCE RESET USER PLAN TO PENDING (Prevents Stale Active State from Previous Tests)
                if (contact.plan) {
                    await setVal(`/users/${safeEmail}/plan`, {
                        ...contact.plan,
                        status: 'PENDING',
                        startDate: new Date(),
                        updatedAt: new Date()
                    });
                }

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
                            plan: contact.plan || null, // Capture Plan for Pricing
                            credits: 0
                        };
                        await pushVal('/leads', newLead);
                        console.log(`Created PENDING BOOK Lead for ${contact.email}`);
                    }
                } catch (e) {
                    console.error("Error creating pending lead:", e);
                }

                return res.json({ error: "Payment Required", code: "PAYMENT_REQUIRED" });
            }

            // Deduct Credit
            await setVal(`/credits/${safeEmail}`, credits - 1);
            console.log(`[PROJECT] Deducted 1 credit from ${contact.email}. Remaining: ${credits - 1}`);
        }
        // ---------------------------

        const project = await QueueService.createProject({ authorName, topic, language, contact });

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

                if (leadIndex !== -1) {
                    // Update existing BOOK Lead
                    await setVal(`/leads[${leadIndex}]/status`, 'IN_PROGRESS');
                    await setVal(`/leads[${leadIndex}]/topic`, topic);
                    // If name was missing, update it
                    if (!(leads[leadIndex] as any).name) {
                        await setVal(`/leads[${leadIndex}]/name`, authorName);
                    }
                    console.log(`Linked Project to existing Book Lead ${leadIndex}`);
                } else {
                    // Create NEW Lead so it shows in Admin as a separate row from Subscription
                    const newLead = {
                        id: uuidv4(),
                        email: contact.email,
                        name: authorName || 'Autor',
                        phone: contact.phone || '',
                        status: 'IN_PROGRESS',
                        type: 'BOOK', // Origin: Book Generator
                        topic: topic,
                        date: new Date(),
                        created_at: new Date(),
                        plan: null, // Keep separate from subscription plan data
                        credits: 0 // Consumed now
                    };
                    await pushVal('/leads', newLead);
                    console.log(`Created NEW BOOK Lead for Project: ${contact.email}`);
                }

            } catch (err) {
                console.error("Error creating/updating lead for project:", err);
            }
        }
        // ------------------------------------------------------------------

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
    const { language, email: bodyEmail } = req.body;
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
    if (userEmail) {
        await reloadDB(); // Force sync to see Admin Approval

        let hasAccess = false;
        let currentStatus = 'UNKNOWN';

        // VIP BYPASS (Hotfix)
        if (userEmail.toLowerCase().includes('subevilaqua')) {
            hasAccess = true;
            currentStatus = 'VIP';
            console.log(`[VIP] Access Granted for ${userEmail}`);
        }

        if (!hasAccess) {
            // 1. Check Unified Ledger Credits (Source of Truth)
            const safeEmail = (userEmail as string).toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            const ledgerCredits = Number((await getVal(`/credits/${safeEmail}`)) || 0);

            if (ledgerCredits > 0) {
                hasAccess = true;
                console.log(`[startResearch] Granted Access via Ledger Credits: ${ledgerCredits}`);
            }

            // 2. Check Legacy Leads Status
            if (!hasAccess) {
                const rawLeads = await getVal('/leads') || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

                for (let i = leads.length - 1; i >= 0; i--) {
                    const l = leads[i] as any;
                    if (l.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
                        currentStatus = l.status;
                        if (l.status === 'APPROVED' || l.status === 'IN_PROGRESS' || l.status === 'LIVRO ENTREGUE' || (l.credits || 0) > 0) {
                            hasAccess = true;
                            break;
                        }
                    }
                }
            }
        }

        if (!hasAccess) {
            console.warn(`[startResearch] BLOCKED ${userEmail}. Ledger: ${Number((await getVal(`/credits/${userEmail.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_')}`)) || 0)} Status: ${currentStatus}`);
            return res.status(402).json({ error: "Aguardando confirmação de pagamento.", code: "PAYMENT_REQUIRED" });
        }
    }

    // Update status and ensure language is in metadata (even if in-memory)
    await QueueService.updateMetadata(id, {
        status: 'RESEARCHING',
        progress: 1,
        statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
        language: language || project.metadata.language || 'pt'
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

    // Respond to client IMMEDIATELY to prevent timeout
    res.json({ message: "Research started" });

    // Background Process (Fire-and-Forget)
    // This allows the main request handler to complete instantly (exit code 200)
    // while the generation continues in the background.
    (async () => {
        try {
            const topic = project.metadata.topic;
            const targetLang = language || project.metadata.language || 'pt';

            /* [BACKGROUND TASK START] */

            // Step 1: YouTube
            await QueueService.updateMetadata(id, {
                progress: 5,
                statusMessage: `📡 Calibrando sensores para varredura no YouTube: "${topic}"...`
            });
            let ytResearch = "";
            try {
                ytResearch = await AIService.researchYoutube(topic, targetLang);
            } catch (ytError: any) {
                console.error("YouTube Research Failed (Continuing anyway):", ytError);
                ytResearch = "Pesquisa YouTube indisponível no momento. Seguindo com Google Search.";
            }

            await QueueService.updateMetadata(id, {
                progress: 12,
                statusMessage: `⚙️ Processando dados brutos de vídeo e extraindo insights virais...`
            });

            // Step 2: Google
            await QueueService.updateMetadata(id, {
                progress: 15,
                statusMessage: `🔍 Iniciando mineração profunda no Google Search...`
            });
            const googleResearch = await AIService.researchGoogle(topic, ytResearch, targetLang);


            await QueueService.updateMetadata(id, {
                progress: 22,
                statusMessage: `📊 Refinando minério de dados e identificando padrões de busca...`
            });

            // Step 3: Competitors
            await QueueService.updateMetadata(id, {
                progress: 25,
                statusMessage: `🏆 Desconstruindo engenharia reversa dos Best-Sellers atuais...`
            });
            const compResearch = await AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);

            const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
            await QueueService.updateProject(id, { researchContext: fullContext });

            // Auto-proceed to Titles
            await QueueService.updateMetadata(id, {
                progress: 28,
                statusMessage: "🏗️ Moldando estruturas de títulos de alta conversão..."
            });

            const titles = await AIService.generateTitleOptions(topic, fullContext, targetLang);
            await QueueService.updateProject(id, { titleOptions: titles });

            await QueueService.updateMetadata(id, {
                status: 'WAITING_TITLE',
                progress: 30,
                statusMessage: "✅ Pesquisa industrial concluída. Matéria-prima pronta para seleção."
            });

        } catch (error: any) {
            console.error("Research Error:", error);
            const errorMessage = error?.message || "Erro desconhecido";
            await QueueService.updateMetadata(id, {
                status: 'FAILED',
                statusMessage: `⚠️ Falha na linha de produção: ${errorMessage} `
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
        bookTitle: title, subTitle: subtitle,
        status: 'GENERATING_STRUCTURE',
        progress: 35,
        statusMessage: "TÍTULO DO LIVRO ESCOLHIDO, INFORMAÇÕES ENCAMINHADAS PARA NOSSOS ESCRITORES PROFISSIONAIS."
    });

    // Update Lead in JSON DB to show proper Title in Admin
    try {
        const userEmail = project.metadata.contact?.email;
        if (userEmail) {
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

            // Find latest lead for this email
            let leadIndex = -1;
            for (let i = leads.length - 1; i >= 0; i--) {
                const l: any = leads[i];
                if (l.email?.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
                    leadIndex = i;
                    break;
                }
            }

            if (leadIndex !== -1) {
                await setVal(`/leads[${leadIndex}]/bookTitle`, title);
                await setVal(`/leads[${leadIndex}]/topic`, title); // Replace topic as requested to clean up view
            }
        }
    } catch (e) {
        console.error("Failed to update Lead title:", e);
    }

    res.json({ message: "Title selected, generating structure..." });

    try {
        const lang = project.metadata.language || 'pt'; // Fallback
        const structure = await AIService.generateStructure(title, subtitle, project.researchContext, lang);
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

    const targetLang = language || project.metadata.language || 'pt';

    await QueueService.updateMetadata(id, { status: 'WRITING_CHAPTERS', progress: 41 });
    res.json({ message: "Content generation started" });

    try {
        const chapters = [...project.structure];
        const total = chapters.length;

        // 1. Write Chapters
        for (let i = 0; i < total; i++) {
            const chapter = chapters[i];

            // RESUME LOGIC: Skip if already generated and has content
            if (chapter.isGenerated && chapter.content && chapter.content.length > 100) {
                console.log(`Skipping Chapter ${chapter.id} (Already generated)`);
                continue;
            }

            await QueueService.updateMetadata(id, {
                statusMessage: `Escrevendo Capítulo ${chapter.id}: ${chapter.title}...`,
                progress: 41 + Math.floor(((i) / total) * 40) // 41% to 81%
            });

            // RETRY STRATEGY (3 Attempts)
            let success = false;
            let attempts = 0;
            while (!success && attempts < 3) {
                try {
                    attempts++;
                    // Pass language to writer
                    const meta = { ...project.metadata, language: targetLang };
                    const content = await AIService.writeChapter(meta, chapter, project.structure, project.researchContext);
                    chapter.content = content;
                    chapter.isGenerated = true;
                    await QueueService.updateProject(id, { structure: chapters });
                    success = true;
                } catch (e: any) {
                    console.error(`Error writing chapter ${chapter.id} (Attempt ${attempts}/3):`, e);
                    if (attempts >= 3) {
                        // EMERGENCY FALLBACK TO PREVENT HALT
                        console.error(`CRITICAL: Chapter ${chapter.id} failed after 3 attempts. Using Emergency Placeholder.`);
                        chapter.content = `[ERRO NA GERAÇÃO DESTE CAPÍTULO]\n\nInfelizmente a IA não conseguiu completar este capítulo após múltiplas tentativas. O tema era: ${chapter.title}.\n\nSugerimos que você escreva este trecho manualmente ou regenere o projeto.`;
                        chapter.isGenerated = true; // Mark as done to finish the process!!!
                        await QueueService.updateProject(id, { structure: chapters });
                        success = true; // Force success to continue loop
                    } else {
                        // Wait 2s before retry
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
            const introContent = await AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);

            const introChapter: any = { id: 0, title: "Introdução", content: introContent, isGenerated: true };

            if (!project.structure) project.structure = [];

            if (project.structure.length > 0 && project.structure[0].id !== 0) {
                project.structure.unshift(introChapter);
            } else {
                project.structure[0] = introChapter;
            }
            await QueueService.updateProject(id, { structure: project.structure });
        } else {
            console.log(`Skipping Introduction for project ${id} (Already generated)`);
        }

        // 2.5. Generate Automatic Extras if missing
        if (!project.metadata.dedication || !project.metadata.acknowledgments || !project.metadata.aboutAuthor) {
            console.log("Generating missing Extras (Dedication/Ack/About)...");
            await QueueService.updateMetadata(id, {
                statusMessage: "Criando Dedicatória e Agradecimentos Especiais..."
            });

            try {
                // Check User Plan
                const ownerEmail = project.metadata.contact?.email || "";
                const safeEmail = ownerEmail.toLowerCase().trim().replace(/\./g, '_');
                let planName = 'STARTER';

                if (safeEmail) {
                    const userPlan: any = await getVal(`users/${safeEmail}/plan`);
                    if (userPlan && userPlan.status === 'ACTIVE') {
                        planName = userPlan.name || 'STARTER';
                    }
                }

                const isProOrBlack = planName.includes('PRO') || planName.includes('BLACK') || planName.includes('VIP');
                console.log(`User Plan: ${planName} (Auto-Gen: ${isProOrBlack})`);

                if (isProOrBlack) {
                    const extras = await AIService.generateExtras(
                        project.metadata,
                        "", // default to family/friends
                        "", // default to universal
                        "", // default context
                        targetLang
                    );

                    // Use generated content
                    project.metadata.dedication = extras.dedication;
                    project.metadata.acknowledgments = extras.acknowledgments;
                    project.metadata.aboutAuthor = extras.aboutAuthor;

                } else {
                    // STARTER: Manual Placeholders
                    // Using brackets so user knows to edit
                    project.metadata.dedication = "[ESCREVA AQUI SUA DEDICATÓRIA]";
                    project.metadata.acknowledgments = "[ESCREVA AQUI SEUS AGRADECIMENTOS]";
                    project.metadata.aboutAuthor = "[ESCREVA AQUI A BIOGRAFIA DO AUTOR]";
                }

                // Save to DB
                await QueueService.updateMetadata(id, {
                    dedication: project.metadata.dedication,
                    acknowledgments: project.metadata.acknowledgments,
                    aboutAuthor: project.metadata.aboutAuthor
                });

            } catch (e) {
                console.error("Failed to auto-generate extras:", e);
            }
        }

        // 3. Marketing
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });

        // Pass full book content context implicitly via research context or just metadata.
        // Ideally we pass a summary of what was written, but researchContext + structure is often enough for marketing.
        const marketing = await AIService.generateMarketing(project.metadata, project.researchContext, project.structure, targetLang);
        await QueueService.updateProject(id, { marketing });

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

        // 7. Completed / Waiting Details
        await QueueService.updateMetadata(id, {
            status: 'WAITING_DETAILS',
            progress: 100,
            statusMessage: "DIAGRAMAÇÃO CONCLUIDA, LIVRO LIBERADO PARA DOWNLOAD DO CLIENTE..."
        });

    } catch (error) {
        console.error(error);
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro na geração do conteúdo." });
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

    // Hardcoded URL for now, or dynamic based on REFERER if available, but here we are in backend.
    // Assuming standard port 3001 for backend/downloads.
    // In production this should be the PUBLIC_URL.
    const downloadLink = `http://localhost:3001/downloads/${filename}`;

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
                await DocService.generateBookDocx(project);

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

        const titles = await AIService.generateTitleOptions(topic, fullContext, targetLang);
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
