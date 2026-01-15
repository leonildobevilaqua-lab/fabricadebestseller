import { Request, Response } from 'express';
import * as QueueService from '../services/queue.service';
import * as AIService from '../services/ai.service';
import * as DocService from '../services/doc.service';
import { TitleOption, BookProject } from '../types';
import { sendEmail } from '../services/email.service';
import { pushVal, getVal, setVal } from '../services/db.service';
import * as StorageService from '../services/storage.service';
import path from 'path';
import mammoth from 'mammoth';
import multer from 'multer';

const upload = multer();

export const create = async (req: Request, res: Response) => {
    const { authorName, topic, language, contact } = req.body;
    try {
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
                    return res.json(existing);
                }
            }
        }

        const project = await QueueService.createProject({ authorName, topic, language, contact });
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
                await DocService.generateBookDocx(fullProject);
                console.log(`Final artifact generated for project ${id}`);

                // --- UPDATE LEAD STATUS TO 'LIVRO ENTREGUE' ---
                const userEmail = fullProject.metadata.contact?.email;
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
    const { language } = req.body;
    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    // --- PAYMENT GATING ---
    try {
        const userEmail = project.metadata.contact?.email;
        if (userEmail) {
            const rawLeads = await getVal('/leads') || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            // Find latest lead
            const lead: any = leads.reverse().find((l: any) => l.email?.toLowerCase().trim() === userEmail.toLowerCase().trim());

            if (!lead || (lead.status !== 'APPROVED' && lead.status !== 'IN_PROGRESS' && (lead.credits || 0) <= 0)) {
                console.warn(`Blocked startResearch for ${userEmail}: Payment not confirmed. Lead Status: ${lead?.status}`);
                return res.status(402).json({ error: "Aguardando confirmação de pagamento." });
            }
        }
    } catch (e) {
        console.error("Payment check error:", e);
    }
    // ----------------------

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

    res.json({ message: "Research started" });

    // Background Process with Granular Updates
    try {
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
            // Fallback or continue? Let's log and maybe use empty string or throw depending on severity.
            // For now, let's treat it as critical to see the error.
            await QueueService.updateMetadata(id, {
                status: 'FAILED',
                statusMessage: `Erro na pesquisa YouTube: ${ytError.message || JSON.stringify(ytError)}`
            });
            return; // Stop execution
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

            // Wait a bit to avoid rate limits if loop is tight? No, awaiting generation is enough.

            try {
                // Pass language to writer
                const meta = { ...project.metadata, language: targetLang };
                const content = await AIService.writeChapter(meta, chapter, project.structure, project.researchContext);
                chapter.content = content;
                chapter.isGenerated = true;
                await QueueService.updateProject(id, { structure: chapters });
            } catch (e: any) {
                console.error(`Error writing chapter ${chapter.id}:`, e);
                // If error, we stop here and mark as failed. The user can retry.
                // But to make it robust, we should probably mark status as FAILED so frontend shows Retry button.
                // However, we want to allow "Resume".
                throw e;
            }
        }

        // 2. Write Introduction (after chapters to be coherent)
        await QueueService.updateMetadata(id, {
            status: 'WRITING_CHAPTERS',
            progress: 85,
            statusMessage: "Escrevendo a Introdução de alto impacto..."
        });
        const introContent = await AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);
        // Store intro somewhere? Maybe as chapter 0 or specific field. For now, let's prepend to chapter list as Chapter 0 if not exists, or special field.
        // The user requested "Introduction" separately. Let's add it to project structure as a special item or just assume it is Chapter 0.
        // Let's create a "Intro" chapter.
        const introChapter: any = { id: 0, title: "Introdução", content: introContent, isGenerated: true };
        // Prepend to structure if not present
        if (project.structure[0].id !== 0) {
            project.structure.unshift(introChapter);
        } else {
            project.structure[0] = introChapter;
        }
        await QueueService.updateProject(id, { structure: project.structure });

        // 3. Marketing
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });

        // Pass full book content context implicitly via research context or just metadata.
        // Ideally we pass a summary of what was written, but researchContext + structure is often enough for marketing.
        const marketing = await AIService.generateMarketing(project.metadata, project.researchContext, "", targetLang);
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

export const sendBookEmail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File required" });
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        console.log(`Sending email to ${email} for project ${id}`);

        // Save file locally first to ensure we have it (optional but good for debug)
        const fs = require('fs');
        const path = require('path');
        const savePath = path.join(__dirname, '../../generated_books');
        if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, { recursive: true });

        const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fullPath = path.join(savePath, `book_${safeEmail}.docx`);
        fs.writeFileSync(fullPath, file.buffer);

        const downloadLink = `http://localhost:3001/downloads/book_${safeEmail}.docx`;

        await sendEmail(
            email,
            "Seu Livro Está Pronto! - Editora 360 Express",
            `Parabéns! Seu livro foi gerado com sucesso.
            
Segue em anexo o arquivo DOCX formatado.

Caso não consiga abrir o anexo, você também pode baixar pelo link abaixo:
${downloadLink}

Atenciosamente,
Equipe Fábrica de Best Sellers`,
            [{ filename: file.originalname || 'livro.docx', content: file.buffer }]
        );
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

    if (!lead || !lead.details?.filePath) return res.status(404).json({ error: "Lead or file not found" });

    // RESPONSE IMMEDIATE
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
