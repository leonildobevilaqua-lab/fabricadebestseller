"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.translateBook = exports.findIdByEmail = exports.regenerateDocx = exports.processDiagramLead = exports.uploadExistingBook = exports.generateExtras = exports.sendBookEmail = exports.generateBookContent = exports.selectTitle = exports.startResearch = exports.update = exports.get = exports.create = void 0;
const QueueService = __importStar(require("../services/queue.service"));
const AIService = __importStar(require("../services/ai.service"));
const DocService = __importStar(require("../services/doc.service"));
const email_service_1 = require("../services/email.service");
const db_service_1 = require("../services/db.service");
const StorageService = __importStar(require("../services/storage.service"));
const path_1 = __importDefault(require("path"));
const mammoth_1 = __importDefault(require("mammoth"));
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const upload = (0, multer_1.default)();
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { authorName, topic, language, contact } = req.body;
    try {
        const safeEmail = (contact === null || contact === void 0 ? void 0 : contact.email) ? contact.email.toLowerCase().trim().replace(/\./g, '_') : null;
        let isResuming = false;
        // RESUME LOGIC: Check if user already has an active project, UNLESS forcing new
        if (contact && contact.email && !req.body.forceNew) {
            const existing = yield QueueService.getProjectByEmail(contact.email);
            // If exists and is NOT Failed/Completed, return it?
            if (existing && existing.metadata.status !== 'COMPLETED' && existing.metadata.status !== 'FAILED') {
                // BUG FIX: Ignore 'Diagramming' projects (Livro Pré-Escrito) if user is trying to create a new book (Generator)
                // Unless the new topic allows it (which it shouldn't if it's manual input)
                if (existing.metadata.topic === 'Livro Pré-Escrito' && topic !== 'Livro Pré-Escrito') {
                    console.log("Ignoring existing Diagramming project for new Book creation flow.");
                    // Do NOT return. Let it create a new one.
                }
                else {
                    console.log(`Resuming existing project ${existing.id} for ${contact.email}`);
                    // If IDLE, update metadata with new inputs?
                    if (existing.metadata.status === 'IDLE') {
                        yield QueueService.updateMetadata(existing.id, { authorName, topic, language });
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
            const credits = Number((yield (0, db_service_1.getVal)(`/credits/${safeEmail}`)) || 0);
            // Check for any manually APPROVED leads (Voucher/Manual) that haven't been consumed?
            // For now, we rely on 'credits'. 
            // If the user paid, the webhook added a credit. 
            // If admin approved 'CREDIT', it added a credit.
            if (credits <= 0) {
                console.log(`[PROJECT] Denied creation for ${contact.email}: No credits. Creating PENDING lead.`);
                // FORCE RESET USER PLAN TO PENDING (Prevents Stale Active State from Previous Tests)
                if (contact.plan) {
                    yield (0, db_service_1.setVal)(`/users/${safeEmail}/plan`, Object.assign(Object.assign({}, contact.plan), { status: 'PENDING', startDate: new Date(), updatedAt: new Date() }));
                }
                // CREATE PENDING LEAD FOR ADMIN VISIBILITY
                try {
                    const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                    // Check if a PENDING book lead already exists to avoid duplicates
                    const hasPending = leads.some((l) => {
                        var _a;
                        return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === contact.email.toLowerCase().trim() &&
                            l.type === 'BOOK' &&
                            (l.status === 'PENDING' || l.status === 'WAITING_PAYMENT');
                    });
                    if (!hasPending) {
                        const newLead = {
                            id: (0, uuid_1.v4)(),
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
                        yield (0, db_service_1.pushVal)('/leads', newLead);
                        console.log(`Created PENDING BOOK Lead for ${contact.email}`);
                    }
                }
                catch (e) {
                    console.error("Error creating pending lead:", e);
                }
                return res.json({ error: "Payment Required", code: "PAYMENT_REQUIRED" });
            }
            // Deduct Credit
            yield (0, db_service_1.setVal)(`/credits/${safeEmail}`, credits - 1);
            console.log(`[PROJECT] Deducted 1 credit from ${contact.email}. Remaining: ${credits - 1}`);
        }
        // ---------------------------
        const project = yield QueueService.createProject({ authorName, topic, language, contact });
        // --- CRITICAL FIX: Ensure Lead Exists for Admin Panel Visibility & Separate Sub/Book ---
        if (contact && contact.email) {
            try {
                const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                let leadIndex = -1;
                // Search backwards for latest BOOK lead
                for (let i = leads.length - 1; i >= 0; i--) {
                    const l = leads[i];
                    // Match Email
                    if (((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === contact.email.toLowerCase().trim()) {
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
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'IN_PROGRESS');
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/topic`, topic);
                    // If name was missing, update it
                    if (!leads[leadIndex].name) {
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/name`, authorName);
                    }
                    console.log(`Linked Project to existing Book Lead ${leadIndex}`);
                }
                else {
                    // Create NEW Lead so it shows in Admin as a separate row from Subscription
                    const newLead = {
                        id: (0, uuid_1.v4)(),
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
                    yield (0, db_service_1.pushVal)('/leads', newLead);
                    console.log(`Created NEW BOOK Lead for Project: ${contact.email}`);
                }
            }
            catch (err) {
                console.error("Error creating/updating lead for project:", err);
            }
        }
        // ------------------------------------------------------------------
        res.json(project);
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.create = create;
const get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const project = yield QueueService.getProject(req.params.id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    if (!project)
        return res.status(404).json({ error: "Not found" });
    res.json(project);
});
exports.get = get;
const update = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { id } = req.params;
    const updates = req.body; // Expect { metadata: { ... } } or partials
    try {
        if (updates.metadata) {
            yield QueueService.updateMetadata(id, updates.metadata);
        }
        // --- TRIGGER DOCX GENERATION ON COMPLETION ---
        if (((_a = updates.metadata) === null || _a === void 0 ? void 0 : _a.status) === 'COMPLETED') {
            console.log(`Project ${id} marked COMPLETED. Generating final artifact...`);
            const fullProject = yield QueueService.getProject(id);
            if (fullProject) {
                // Ensure structure is sorted/valid if needed?
                // Just generate.
                const artifactPath = yield DocService.generateBookDocx(fullProject);
                console.log(`Final artifact generated for project ${id} at ${artifactPath}`);
                const userEmail = (_b = fullProject.metadata.contact) === null || _b === void 0 ? void 0 : _b.email;
                if (userEmail) {
                    // AUTO-SEND EMAIL with Design
                    try {
                        yield notifyUserBookReady(userEmail, fullProject.metadata.bookTitle || "Seu Livro", artifactPath);
                        console.log(`Auto-sent success email to ${userEmail}`);
                    }
                    catch (emailErr) {
                        console.error("Failed to auto-send email:", emailErr);
                    }
                }
                if (userEmail) {
                    const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
                    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
                    // Find latest lead
                    let leadIndex = -1;
                    for (let i = leads.length - 1; i >= 0; i--) {
                        if (((_c = leads[i].email) === null || _c === void 0 ? void 0 : _c.toLowerCase().trim()) === userEmail.toLowerCase().trim()) {
                            leadIndex = i;
                            break;
                        }
                    }
                    if (leadIndex !== -1) {
                        // Set status to "LIVRO ENTREGUE" as requested
                        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'LIVRO ENTREGUE');
                        console.log(`Updated Lead ${leadIndex} status to LIVRO ENTREGUE`);
                    }
                }
            }
        }
        // Add other fields if necessary
        res.json({ success: true });
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.update = update;
const startResearch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const { id } = req.params;
    const { language } = req.body;
    const project = yield QueueService.getProject(id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    const userEmail = (_a = project.metadata.contact) === null || _a === void 0 ? void 0 : _a.email;
    if (userEmail) {
        yield (0, db_service_1.reloadDB)(); // Force sync to see Admin Approval
        let hasAccess = false;
        let currentStatus = 'UNKNOWN';
        // VIP BYPASS (Hotfix)
        if (userEmail.toLowerCase().includes('subevilaqua')) {
            hasAccess = true;
            currentStatus = 'VIP';
            console.log(`[VIP] Access Granted for ${userEmail}`);
        }
        if (!hasAccess) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            for (let i = leads.length - 1; i >= 0; i--) {
                const l = leads[i];
                if (((_b = l.email) === null || _b === void 0 ? void 0 : _b.toLowerCase().trim()) === userEmail.toLowerCase().trim()) {
                    currentStatus = l.status;
                    if (l.status === 'APPROVED' || l.status === 'IN_PROGRESS' || l.status === 'LIVRO ENTREGUE' || (l.credits || 0) > 0) {
                        hasAccess = true;
                        break;
                    }
                }
            }
        }
        if (!hasAccess) {
            console.warn(`Blocked startResearch for ${userEmail}: Payment not confirmed. Lead Status: ${currentStatus}`);
            return res.status(402).json({ error: "Aguardando confirmação de pagamento." });
        }
    }
    // Update status and ensure language is in metadata (even if in-memory)
    yield QueueService.updateMetadata(id, {
        status: 'RESEARCHING',
        progress: 1,
        statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
        language: language || project.metadata.language || 'pt'
    });
    // --- UPDATE LEAD STATUS TO IN_PROGRESS ---
    try {
        const userEmail = (_c = project.metadata.contact) === null || _c === void 0 ? void 0 : _c.email;
        if (userEmail) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            for (let i = leads.length - 1; i >= 0; i--) {
                if (((_d = leads[i].email) === null || _d === void 0 ? void 0 : _d.toLowerCase().trim()) === userEmail.toLowerCase().trim()) {
                    yield (0, db_service_1.setVal)(`/leads[${i}]/status`, 'IN_PROGRESS');
                    console.log(`Updated Lead status to IN_PROGRESS for ${userEmail}`);
                    break;
                }
            }
        }
    }
    catch (e) {
        console.error("Error updating lead status:", e);
    }
    res.json({ message: "Research started" });
    // Background Process with Granular Updates
    try {
        const topic = project.metadata.topic;
        const targetLang = language || project.metadata.language || 'pt';
        // Step 1: YouTube
        yield QueueService.updateMetadata(id, {
            progress: 5,
            statusMessage: `📡 Calibrando sensores para varredura no YouTube: "${topic}"...`
        });
        let ytResearch = "";
        try {
            ytResearch = yield AIService.researchYoutube(topic, targetLang);
        }
        catch (ytError) {
            console.error("YouTube Research Failed (Continuing anyway):", ytError);
            ytResearch = "Pesquisa YouTube indisponível no momento. Seguindo com Google Search.";
        }
        yield QueueService.updateMetadata(id, {
            progress: 12,
            statusMessage: `⚙️ Processando dados brutos de vídeo e extraindo insights virais...`
        });
        // Step 2: Google
        yield QueueService.updateMetadata(id, {
            progress: 15,
            statusMessage: `🔍 Iniciando mineração profunda no Google Search...`
        });
        const googleResearch = yield AIService.researchGoogle(topic, ytResearch, targetLang);
        yield QueueService.updateMetadata(id, {
            progress: 22,
            statusMessage: `📊 Refinando minério de dados e identificando padrões de busca...`
        });
        // Step 3: Competitors
        yield QueueService.updateMetadata(id, {
            progress: 25,
            statusMessage: `🏆 Desconstruindo engenharia reversa dos Best-Sellers atuais...`
        });
        const compResearch = yield AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);
        const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
        yield QueueService.updateProject(id, { researchContext: fullContext });
        // Auto-proceed to Titles
        yield QueueService.updateMetadata(id, {
            progress: 28,
            statusMessage: "🏗️ Moldando estruturas de títulos de alta conversão..."
        });
        const titles = yield AIService.generateTitleOptions(topic, fullContext, targetLang);
        yield QueueService.updateProject(id, { titleOptions: titles });
        yield QueueService.updateMetadata(id, {
            status: 'WAITING_TITLE',
            progress: 30,
            statusMessage: "✅ Pesquisa industrial concluída. Matéria-prima pronta para seleção."
        });
    }
    catch (error) {
        console.error("Research Error:", error);
        const errorMessage = (error === null || error === void 0 ? void 0 : error.message) || "Erro desconhecido";
        yield QueueService.updateMetadata(id, {
            status: 'FAILED',
            statusMessage: `⚠️ Falha na linha de produção: ${errorMessage} `
        });
    }
});
exports.startResearch = startResearch;
const selectTitle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const { title, subtitle } = req.body;
    const project = yield QueueService.getProject(id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    yield QueueService.updateMetadata(id, {
        bookTitle: title, subTitle: subtitle,
        status: 'GENERATING_STRUCTURE',
        progress: 35,
        statusMessage: "TÍTULO DO LIVRO ESCOLHIDO, INFORMAÇÕES ENCAMINHADAS PARA NOSSOS ESCRITORES PROFISSIONAIS."
    });
    // Update Lead in JSON DB to show proper Title in Admin
    try {
        const userEmail = (_a = project.metadata.contact) === null || _a === void 0 ? void 0 : _a.email;
        if (userEmail) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            // Find latest lead for this email
            let leadIndex = -1;
            for (let i = leads.length - 1; i >= 0; i--) {
                const l = leads[i];
                if (((_b = l.email) === null || _b === void 0 ? void 0 : _b.toLowerCase().trim()) === userEmail.toLowerCase().trim()) {
                    leadIndex = i;
                    break;
                }
            }
            if (leadIndex !== -1) {
                yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/bookTitle`, title);
                yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/topic`, title); // Replace topic as requested to clean up view
            }
        }
    }
    catch (e) {
        console.error("Failed to update Lead title:", e);
    }
    res.json({ message: "Title selected, generating structure..." });
    try {
        const lang = project.metadata.language || 'pt'; // Fallback
        const structure = yield AIService.generateStructure(title, subtitle, project.researchContext, lang);
        yield QueueService.updateProject(id, { structure });
        yield QueueService.updateMetadata(id, {
            status: 'REVIEW_STRUCTURE', // New status for manual approval
            progress: 40,
            currentStep: 'REVIEW_STRUCTURE', // TS needs this to be valid
            statusMessage: "Estrutura pronta para aprovação."
        });
    }
    catch (error) {
        yield QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro ao gerar estrutura." });
    }
});
exports.selectTitle = selectTitle;
const generateBookContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const { language } = req.body;
    const project = yield QueueService.getProject(id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    const targetLang = language || project.metadata.language || 'pt';
    yield QueueService.updateMetadata(id, { status: 'WRITING_CHAPTERS', progress: 41 });
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
            yield QueueService.updateMetadata(id, {
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
                    const meta = Object.assign(Object.assign({}, project.metadata), { language: targetLang });
                    const content = yield AIService.writeChapter(meta, chapter, project.structure, project.researchContext);
                    chapter.content = content;
                    chapter.isGenerated = true;
                    yield QueueService.updateProject(id, { structure: chapters });
                    success = true;
                }
                catch (e) {
                    console.error(`Error writing chapter ${chapter.id} (Attempt ${attempts}/3):`, e);
                    if (attempts >= 3) {
                        // EMERGENCY FALLBACK TO PREVENT HALT
                        console.error(`CRITICAL: Chapter ${chapter.id} failed after 3 attempts. Using Emergency Placeholder.`);
                        chapter.content = `[ERRO NA GERAÇÃO DESTE CAPÍTULO]\n\nInfelizmente a IA não conseguiu completar este capítulo após múltiplas tentativas. O tema era: ${chapter.title}.\n\nSugerimos que você escreva este trecho manualmente ou regenere o projeto.`;
                        chapter.isGenerated = true; // Mark as done to finish the process!!!
                        yield QueueService.updateProject(id, { structure: chapters });
                        success = true; // Force success to continue loop
                    }
                    else {
                        // Wait 2s before retry
                        yield new Promise(r => setTimeout(r, 2000));
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
            yield QueueService.updateMetadata(id, {
                status: 'WRITING_CHAPTERS',
                progress: 85,
                statusMessage: "Escrevendo a Introdução de alto impacto..."
            });
            const introContent = yield AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);
            const introChapter = { id: 0, title: "Introdução", content: introContent, isGenerated: true };
            if (!project.structure)
                project.structure = [];
            if (project.structure.length > 0 && project.structure[0].id !== 0) {
                project.structure.unshift(introChapter);
            }
            else {
                project.structure[0] = introChapter;
            }
            yield QueueService.updateProject(id, { structure: project.structure });
        }
        else {
            console.log(`Skipping Introduction for project ${id} (Already generated)`);
        }
        // 2.5. Generate Automatic Extras if missing
        if (!project.metadata.dedication || !project.metadata.acknowledgments || !project.metadata.aboutAuthor) {
            console.log("Generating missing Extras (Dedication/Ack/About)...");
            yield QueueService.updateMetadata(id, {
                statusMessage: "Criando Dedicatória e Agradecimentos Especiais..."
            });
            try {
                // Check User Plan
                const ownerEmail = ((_a = project.metadata.contact) === null || _a === void 0 ? void 0 : _a.email) || "";
                const safeEmail = ownerEmail.toLowerCase().trim().replace(/\./g, '_');
                let planName = 'STARTER';
                if (safeEmail) {
                    const userPlan = yield (0, db_service_1.getVal)(`users/${safeEmail}/plan`);
                    if (userPlan && userPlan.status === 'ACTIVE') {
                        planName = userPlan.name || 'STARTER';
                    }
                }
                const isProOrBlack = planName.includes('PRO') || planName.includes('BLACK') || planName.includes('VIP');
                console.log(`User Plan: ${planName} (Auto-Gen: ${isProOrBlack})`);
                if (isProOrBlack) {
                    const extras = yield AIService.generateExtras(project.metadata, "", // default to family/friends
                    "", // default to universal
                    "", // default context
                    targetLang);
                    // Use generated content
                    project.metadata.dedication = extras.dedication;
                    project.metadata.acknowledgments = extras.acknowledgments;
                    project.metadata.aboutAuthor = extras.aboutAuthor;
                }
                else {
                    // STARTER: Manual Placeholders
                    // Using brackets so user knows to edit
                    project.metadata.dedication = "[ESCREVA AQUI SUA DEDICATÓRIA]";
                    project.metadata.acknowledgments = "[ESCREVA AQUI SEUS AGRADECIMENTOS]";
                    project.metadata.aboutAuthor = "[ESCREVA AQUI A BIOGRAFIA DO AUTOR]";
                }
                // Save to DB
                yield QueueService.updateMetadata(id, {
                    dedication: project.metadata.dedication,
                    acknowledgments: project.metadata.acknowledgments,
                    aboutAuthor: project.metadata.aboutAuthor
                });
            }
            catch (e) {
                console.error("Failed to auto-generate extras:", e);
            }
        }
        // 3. Marketing
        yield QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING',
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });
        // Pass full book content context implicitly via research context or just metadata.
        // Ideally we pass a summary of what was written, but researchContext + structure is often enough for marketing.
        const marketing = yield AIService.generateMarketing(project.metadata, project.researchContext, project.structure, targetLang);
        yield QueueService.updateProject(id, { marketing });
        // 4. Content Finished
        yield QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING',
            progress: 96,
            statusMessage: "Conteúdo do livro finalizado, livro encaminhado aos nossos agentes revisores."
        });
        yield new Promise(r => setTimeout(r, 2000));
        // 5. Review
        yield QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING',
            progress: 97,
            statusMessage: "REVISÃO CONCLUIDA, LIVRO LIBERADO PARA O SETOR DE DIAGRAMAÇÃO..."
        });
        yield new Promise(r => setTimeout(r, 2000));
        // 6. Diagramming
        yield QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING',
            progress: 98,
            statusMessage: "Processo de diagramação em andamento..."
        });
        yield new Promise(r => setTimeout(r, 1000));
        // 7. Completed / Waiting Details
        yield QueueService.updateMetadata(id, {
            status: 'WAITING_DETAILS',
            progress: 100,
            statusMessage: "DIAGRAMAÇÃO CONCLUIDA, LIVRO LIBERADO PARA DOWNLOAD DO CLIENTE..."
        });
    }
    catch (error) {
        console.error(error);
        yield QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro na geração do conteúdo." });
    }
});
exports.generateBookContent = generateBookContent;
function notifyUserBookReady(email, bookTitle, filePath) {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield (0, email_service_1.sendEmail)(email, `Seu Livro "${bookTitle}" Está Pronto! - Editora 360 Express`, `Seu livro ${bookTitle} está pronto! Faça o download no anexo.`, // Fallback text
        [{ filename: filename, content: fileBuffer }], htmlContent);
    });
}
;
const sendBookEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { email } = req.body;
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "File required" });
    if (!email)
        return res.status(400).json({ error: "Email required" });
    try {
        console.log(`Sending email to ${email} for project ${id}`);
        // Save file locally logic preserved
        const fs = require('fs');
        const path = require('path');
        const savePath = path.join(__dirname, '../../generated_books');
        if (!fs.existsSync(savePath))
            fs.mkdirSync(savePath, { recursive: true });
        const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fullPath = path.join(savePath, `book_${safeEmail}.docx`);
        fs.writeFileSync(fullPath, file.buffer);
        // Notify
        yield notifyUserBookReady(email, "Seu Livro", fullPath);
        res.json({ success: true });
    }
    catch (error) {
        console.error("Email Error:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.sendBookEmail = sendBookEmail;
const generateExtras = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { dedicationTo, ackTo, aboutAuthorContext, language } = req.body;
    const project = yield QueueService.getProject(id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    try {
        const lang = language || project.metadata.language || 'pt';
        const extras = yield AIService.generateExtras(project.metadata, dedicationTo, ackTo, aboutAuthorContext, lang);
        res.json(extras);
    }
    catch (error) {
        console.error("Error generating extras:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.generateExtras = generateExtras;
// Imports moved to top
const uploadExistingBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone } = req.body;
    const file = req.file;
    if (!file)
        return res.status(400).json({ error: "File required" });
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir))
            fs.mkdirSync(uploadsDir, { recursive: true });
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
        yield (0, db_service_1.pushVal)('/leads', lead);
        res.json({ success: true, message: "Livro enviado para análise." });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
exports.uploadExistingBook = uploadExistingBook;
const processDiagramLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { leadId } = req.body;
    // 1. Get Lead from JSON DB
    const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
    const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
    let leadIndex = -1;
    let lead = null;
    for (let i = 0; i < leads.length; i++) {
        if (leads[i].id === leadId) {
            leadIndex = i;
            lead = leads[i];
            break;
        }
    }
    // If no file, check if it's an AI Generation Lead (Type BOOK)
    if ((!((_a = lead.details) === null || _a === void 0 ? void 0 : _a.filePath)) && lead.topic) {
        // --- AI GENERATION FLOW ---
        try {
            // Update Status
            yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'APPROVED');
            yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/productionStatus`, 'IN_PROGRESS'); // UI indicator
            res.json({ success: true, message: "Fábrica iniciada! Geração do livro começou." });
            (() => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    console.log(`[Admin] Force-starting AI Generation for ${lead.email}`);
                    // 1. Create Project
                    const project = yield QueueService.createProject({
                        authorName: lead.authorName || lead.name || "Autor Desconhecido",
                        topic: lead.topic,
                        language: 'pt', // Default to PT for admin force start
                        contact: { name: lead.name, email: lead.email, phone: lead.fullPhone || lead.phone }
                    });
                    // Update Lead
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/projectId`, project.id);
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/productionStatus`, 'RESEARCHING');
                    // Set Auto-Generate Flag for Frontend to auto-advance
                    yield (0, db_service_1.setVal)(`/projects/${project.id}/metadata/autoGenerate`, true);
                    // 2. Start Research (Async)
                    // We call the controller logic directly or via API? 
                    // Better to call QueueService if available, or just reuse the logic from startResearch.
                    // Since startResearch is a Controller method, we might need to simulate it or extract logic.
                    // To keep it simple, we use the API via internal fetch or direct service call if possible.
                    // But here we are in the controller.
                    // Let's call startResearch logic manually using QueueService/AIService
                    console.log(`[Admin] Project Created ${project.id}. Starting Research...`);
                    // Trigger Research
                    yield performResearch(project.id, 'pt');
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
                }
                catch (err) {
                    console.error("[Admin] AI Generation Error", err);
                    yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/productionStatus`, 'FAILED');
                }
            }))();
        }
        catch (e) {
            res.status(500).json({ error: e.message });
        }
        return;
    }
    if (!lead || !((_b = lead.details) === null || _b === void 0 ? void 0 : _b.filePath))
        return res.status(404).json({ error: "Lead or file not found" });
    // RESPONSE IMMEDIATE (Existing File Logic)
    try {
        // Update Lead Status to APPROVED immediately to unblock UI
        yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/status`, 'APPROVED');
        // Respond to Admin/Webhook
        res.json({ success: true, message: "Processamento iniciado em segundo plano." });
        // --- BACKGROUND PROCESSING ---
        // We use a self-executing async function or just don't await the promise
        (() => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                console.log(`Starting background diagramming for lead ${lead.id}`);
                // 2. Read File
                const filePath = lead.details.filePath;
                // Check if it is a URL or local path (legacy)
                let rawText = "";
                let fileBuffer = null;
                const fs = require('fs');
                if (filePath.startsWith('http')) {
                    fileBuffer = yield StorageService.downloadFile(filePath);
                }
                else {
                    if (fs.existsSync(filePath)) {
                        fileBuffer = fs.readFileSync(filePath);
                    }
                }
                if (!fileBuffer) {
                    throw new Error("Could not retrieve file content from storage.");
                }
                const ext = path_1.default.extname(lead.details.originalName || filePath).toLowerCase(); // Use original name for extension if possible
                if (ext === '.docx') {
                    const result = yield mammoth_1.default.extractRawText({ buffer: fileBuffer });
                    rawText = result.value;
                }
                else if (ext === '.txt' || ext === '.md') {
                    rawText = fileBuffer.toString('utf-8');
                }
                else {
                    throw new Error(`Formato de arquivo não suportado para diagramação automática: ${ext}. Por favor envie .docx ou .txt`);
                }
                console.log(`[Diagramming] Extracted text length: ${rawText.length}`);
                if (!rawText || rawText.trim().length < 100) {
                    throw new Error("Não foi possível extrair texto suficiente do arquivo. Verifique se o arquivo não está corrompido ou se é uma imagem.");
                }
                // 3. Structure Content
                const structure = yield AIService.structureBookFromText(rawText);
                // Safety Check: Did AI return ANY structure?
                if (!structure || !structure.structure || structure.structure.length === 0) {
                    // Fallback: Treat whole text as one chapter?
                    // Or just error out.
                    console.error("[Diagramming] AI failed to structure content.");
                    throw new Error("A IA não conseguiu identificar capítulos no texto fornecido.");
                }
                console.log(`[Diagramming] AI Structure result: Success | Chapters: ${structure.structure.length}`);
                // 4. Create Project
                const project = yield QueueService.createProject({
                    authorName: ((_a = structure.metadata) === null || _a === void 0 ? void 0 : _a.authorName) || lead.name,
                    topic: ((_b = structure.metadata) === null || _b === void 0 ? void 0 : _b.topic) || "Livro Pré-Escrito",
                    language: 'pt',
                    contact: { name: lead.name, email: lead.email, phone: lead.phone }
                });
                // 5. Populate Project
                project.metadata.bookTitle = ((_c = structure.metadata) === null || _c === void 0 ? void 0 : _c.bookTitle) || "Título Desconhecido";
                project.metadata.subTitle = ((_d = structure.metadata) === null || _d === void 0 ? void 0 : _d.subTitle) || "";
                project.metadata.status = 'WAITING_DETAILS';
                project.metadata.progress = 100;
                project.structure = structure.structure || [];
                // Ensure structure has valid IDs
                if (project.structure && !project.structure.every((c) => c.id)) {
                    project.structure = project.structure.map((c, i) => (Object.assign(Object.assign({}, c), { id: i + 1 })));
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
                yield QueueService.updateProject(project.id, {
                    structure: project.structure,
                    metadata: project.metadata
                });
                // 6. Generate DOCX
                yield DocService.generateBookDocx(project);
                // Update Project ID in Lead (Status is already Approved)
                yield (0, db_service_1.setVal)(`/leads[${leadIndex}]/projectId`, project.id);
                console.log(`Background diagramming complete for lead ${lead.id}, Project: ${project.id}`);
            }
            catch (bgError) {
                console.error("Background Diagram Error:", bgError);
                // Update Logic: Set error on Metadata or Lead so user knows?
                // Currently no UI for error details on lead.
                // At least preventing the "Wrong Book" is better than delivering garbage.
            }
        }))();
    }
    catch (e) {
        console.error("Immediate Response Error:", e);
        if (!res.headersSent)
            res.status(500).json({ error: e.message });
    }
});
exports.processDiagramLead = processDiagramLead;
const regenerateDocx = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    try {
        const project = yield QueueService.getProject(id);
        if (!project) {
            console.error(`Regenerate: Project ID ${id} NOT found.`);
            return res.status(404).json({ error: "Project not found" });
        }
        console.log(`Regenerating DOCX for Project: ${project.id}. Title: ${project.metadata.bookTitle}. Chapters: ${((_a = project.structure) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
        let targetProject = project;
        // Fallback Logic Removed: Do NOT swap project context implicitly.
        if (!targetProject.structure || targetProject.structure.length === 0) {
            console.warn(`Project ${id} structure is empty. Proceeding anyway (may generate empty doc).`);
        }
        console.log(`Generating DOCX using Project ID: ${targetProject.id}`);
        yield DocService.generateBookDocx(targetProject);
        res.json({ success: true, message: "Docx regenerado com sucesso" });
    }
    catch (e) {
        console.error("Regenerate DOCX Error:", e);
        res.status(500).json({ error: e.message });
    }
});
exports.regenerateDocx = regenerateDocx;
const findIdByEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    console.log(`Find ID by Email requested for: ${email}`);
    try {
        const project = yield QueueService.getProjectByEmail(email);
        if (project) {
            console.log(`Found Project ID: ${project.id} for email ${email}. Title: ${project.metadata.bookTitle}`);
            res.json({ id: project.id });
        }
        else {
            console.log(`No valid project found for email ${email}`);
            res.json({ id: null });
        }
    }
    catch (e) {
        res.status(500).json({ error: e.message });
    }
});
exports.findIdByEmail = findIdByEmail;
// --- TRANSLATION FEATURE ---
const translateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { targetLang } = req.body; // 'en', 'es', 'pt'
    if (!['en', 'es', 'pt'].includes(targetLang)) {
        return res.status(400).json({ error: "Idioma inválido." });
    }
    try {
        const project = (yield (0, db_service_1.getVal)(`/projects/${id}`));
        if (!project || !project.structure) {
            return res.status(404).json({ error: "Projeto não encontrado ou sem conteúdo gerado." });
        }
        // Check if already translating
        const translations = project.metadata.translations || {};
        const currentTrans = translations[targetLang];
        if ((currentTrans === null || currentTrans === void 0 ? void 0 : currentTrans.status) === 'IN_PROGRESS') {
            return res.json({ success: true, message: "Tradução em andamento.", status: 'IN_PROGRESS' });
        }
        if ((currentTrans === null || currentTrans === void 0 ? void 0 : currentTrans.status) === 'COMPLETED') {
            return res.json({ success: true, message: "Tradução já concluída.", status: 'COMPLETED' });
        }
        // Set status to IN_PROGRESS
        const newTranslations = Object.assign(Object.assign({}, translations), { [targetLang]: { status: 'IN_PROGRESS', progress: 0 } });
        yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, newTranslations);
        res.json({ success: true, message: "Tradução iniciada." });
        // --- BACKGROUND TRANSLATION SIMULATION (Replace with Real AI later) ---
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Simulate processing time per chapter
                const totalChapters = project.structure.length;
                const translatedStructure = [];
                for (let i = 0; i < totalChapters; i++) {
                    const chapter = project.structure[i];
                    // Simulate AI Translation Delay
                    yield new Promise(r => setTimeout(r, 2000));
                    // Mock Translation Logic
                    let suffix = targetLang === 'en' ? ' (English)' : targetLang === 'es' ? ' (Español)' : ' (Português)';
                    translatedStructure.push(Object.assign(Object.assign({}, chapter), { title: chapter.title + suffix, content: `[Translated Content to ${targetLang}]\n\n` + chapter.content }));
                    // Update Progress
                    const p = Math.round(((i + 1) / totalChapters) * 100);
                    yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations/${targetLang}/progress`, p);
                }
                // MARK COMPLETED
                const finalTranslations = (yield (0, db_service_1.getVal)(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = {
                    status: 'COMPLETED',
                    structure: translatedStructure
                };
                yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, finalTranslations);
                console.log(`Translation to ${targetLang} completed for project ${id}`);
            }
            catch (err) {
                console.error("Translation Error:", err);
                const finalTranslations = (yield (0, db_service_1.getVal)(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = { status: 'FAILED' };
                yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, finalTranslations);
            }
        }))();
    }
    catch (e) {
        console.error(e);
        // Avoid sending response again if already sent
    }
});
exports.translateBook = translateBook;
// --- HELPER: Perform Research (Logic extracted from startResearch) ---
const performResearch = (projectId, language) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const project = yield QueueService.getProject(projectId);
        if (!project)
            return;
        const id = projectId;
        // Update status and ensure language is in metadata (even if in-memory)
        yield QueueService.updateMetadata(id, {
            status: 'RESEARCHING',
            progress: 1,
            statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
            language: language || project.metadata.language || 'pt'
        });
        const topic = project.metadata.topic;
        const targetLang = language || project.metadata.language || 'pt';
        // Step 1: YouTube
        yield QueueService.updateMetadata(id, {
            progress: 5,
            statusMessage: `📡 Calibrando sensores para varredura no YouTube: "${topic}"...`
        });
        let ytResearch = "";
        try {
            ytResearch = yield AIService.researchYoutube(topic, targetLang);
        }
        catch (ytError) {
            console.error("YouTube Research Failed:", ytError);
        }
        yield QueueService.updateMetadata(id, {
            progress: 12,
            statusMessage: `⚙️ Processando dados brutos e extraindo insights...`
        });
        // Step 2: Google
        yield QueueService.updateMetadata(id, {
            progress: 15,
            statusMessage: `🔍 Iniciando mineração profunda no Google Search...`
        });
        const googleResearch = yield AIService.researchGoogle(topic, ytResearch, targetLang);
        yield QueueService.updateMetadata(id, {
            progress: 22,
            statusMessage: `📊 Refinando minério de dados...`
        });
        // Step 3: Competitors
        yield QueueService.updateMetadata(id, {
            progress: 25,
            statusMessage: `🏆 Analisando Best-Sellers atuais...`
        });
        const compResearch = yield AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);
        const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
        yield QueueService.updateProject(id, { researchContext: fullContext });
        // Auto-proceed to Titles
        yield QueueService.updateMetadata(id, {
            progress: 28,
            statusMessage: "🏗️ Moldando estruturas de títulos..."
        });
        const titles = yield AIService.generateTitleOptions(topic, fullContext, targetLang);
        yield QueueService.updateProject(id, { titleOptions: titles });
        yield QueueService.updateMetadata(id, {
            status: 'WAITING_TITLE',
            progress: 30,
            statusMessage: "✅ Pesquisa concluída. Matéria-prima pronta para seleção."
        });
        console.log(`[Research] Completed for project ${id}`);
    }
    catch (e) {
        console.error("PerformResearch Error:", e);
        yield QueueService.updateMetadata(projectId, { status: 'FAILED', statusMessage: "Falha na pesquisa." });
    }
});
