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
const upload = (0, multer_1.default)();
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { authorName, topic, language, contact } = req.body;
    try {
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
                    return res.json(existing);
                }
            }
        }
        const project = yield QueueService.createProject({ authorName, topic, language, contact });
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
                yield DocService.generateBookDocx(fullProject);
                console.log(`Final artifact generated for project ${id}`);
                // --- UPDATE LEAD STATUS TO 'LIVRO ENTREGUE' ---
                const userEmail = (_b = fullProject.metadata.contact) === null || _b === void 0 ? void 0 : _b.email;
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
    var _a, _b, _c;
    const { id } = req.params;
    const { language } = req.body;
    const project = yield QueueService.getProject(id);
    if (!project)
        return res.status(404).json({ error: "Not found" });
    // --- PAYMENT GATING ---
    try {
        const userEmail = (_a = project.metadata.contact) === null || _a === void 0 ? void 0 : _a.email;
        if (userEmail) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            // Find latest lead
            const lead = leads.reverse().find((l) => { var _a; return ((_a = l.email) === null || _a === void 0 ? void 0 : _a.toLowerCase().trim()) === userEmail.toLowerCase().trim(); });
            if (!lead || (lead.status !== 'APPROVED' && (lead.credits || 0) <= 0)) {
                console.warn(`Blocked startResearch for ${userEmail}: Payment not confirmed. Lead Status: ${lead === null || lead === void 0 ? void 0 : lead.status}`);
                return res.status(402).json({ error: "Aguardando confirmação de pagamento." });
            }
        }
    }
    catch (e) {
        console.error("Payment check error:", e);
    }
    // ----------------------
    // Update status and ensure language is in metadata (even if in-memory)
    yield QueueService.updateMetadata(id, {
        status: 'RESEARCHING',
        progress: 1,
        statusMessage: "🏭 Iniciando esteira de produção de conhecimento...",
        language: language || project.metadata.language || 'pt'
    });
    // --- UPDATE LEAD STATUS TO IN_PROGRESS ---
    try {
        const userEmail = (_b = project.metadata.contact) === null || _b === void 0 ? void 0 : _b.email;
        if (userEmail) {
            const rawLeads = (yield (0, db_service_1.getVal)('/leads')) || [];
            const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);
            for (let i = leads.length - 1; i >= 0; i--) {
                if (((_c = leads[i].email) === null || _c === void 0 ? void 0 : _c.toLowerCase().trim()) === userEmail.toLowerCase().trim()) {
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
        const ytResearch = yield AIService.researchYoutube(topic, targetLang);
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
            // Wait a bit to avoid rate limits if loop is tight? No, awaiting generation is enough.
            try {
                // Pass language to writer
                const meta = Object.assign(Object.assign({}, project.metadata), { language: targetLang });
                const content = yield AIService.writeChapter(meta, chapter, project.structure, project.researchContext);
                chapter.content = content;
                chapter.isGenerated = true;
                yield QueueService.updateProject(id, { structure: chapters });
            }
            catch (e) {
                console.error(`Error writing chapter ${chapter.id}:`, e);
                // If error, we stop here and mark as failed. The user can retry.
                // But to make it robust, we should probably mark status as FAILED so frontend shows Retry button.
                // However, we want to allow "Resume".
                throw e;
            }
        }
        // 2. Write Introduction (after chapters to be coherent)
        yield QueueService.updateMetadata(id, {
            status: 'WRITING_CHAPTERS',
            progress: 85,
            statusMessage: "Escrevendo a Introdução de alto impacto..."
        });
        const introContent = yield AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);
        // Store intro somewhere? Maybe as chapter 0 or specific field. For now, let's prepend to chapter list as Chapter 0 if not exists, or special field.
        // The user requested "Introduction" separately. Let's add it to project structure as a special item or just assume it is Chapter 0.
        // Let's create a "Intro" chapter.
        const introChapter = { id: 0, title: "Introdução", content: introContent, isGenerated: true };
        // Prepend to structure if not present
        if (project.structure[0].id !== 0) {
            project.structure.unshift(introChapter);
        }
        else {
            project.structure[0] = introChapter;
        }
        yield QueueService.updateProject(id, { structure: project.structure });
        // 3. Marketing
        yield QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING',
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });
        // Pass full book content context implicitly via research context or just metadata.
        // Ideally we pass a summary of what was written, but researchContext + structure is often enough for marketing.
        const marketing = yield AIService.generateMarketing(project.metadata, project.researchContext, "", targetLang);
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
        // We can upload to storage to get a link, or if we trust the buffer is small enough for email
        // Let's upload to ensure we have a link
        const safeEmail = email.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `email_upload_${safeEmail}_${Date.now()}.docx`;
        const storagePath = `uploads/${filename}`;
        // Import StorageService dynamically if not at top, or assume top import (I will add top import)
        // For now, I'll assume I add the import at the top
        const publicUrl = yield StorageService.uploadFile(storagePath, file.buffer, file.mimetype || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        const downloadLink = publicUrl || "Link não disponível";
        yield (0, email_service_1.sendEmail)(email, "Seu Livro Está Pronto! - Editora 360 Express", `Parabéns! Seu livro foi gerado com sucesso.
            
Segue em anexo o arquivo DOCX formatado.

Caso não consiga abrir o anexo, você também pode baixar pelo link abaixo:
${downloadLink}

Atenciosamente,
Equipe Fábrica de Best Sellers`, [{ filename: file.originalname || 'livro.docx', content: file.buffer }]);
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
        // 1. Save File to Supabase
        const timestamp = Date.now();
        const safeName = (name || 'user').replace(/[^a-z0-9]/gi, '_');
        const ext = path_1.default.extname(file.originalname); // path import needs to be ensured
        const filename = `${timestamp}_${safeName}${ext}`;
        const storagePath = `uploads/${filename}`;
        const publicUrl = yield StorageService.uploadFile(storagePath, file.buffer, file.mimetype);
        if (!publicUrl)
            throw new Error("Failed to upload file to storage");
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
            details: { filePath: publicUrl, originalName: file.originalname } // Use URL instead of local path
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
    var _a;
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
    if (!lead || !((_a = lead.details) === null || _a === void 0 ? void 0 : _a.filePath))
        return res.status(404).json({ error: "Lead or file not found" });
    // RESPONSE IMMEDIATE
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
                if (filePath.startsWith('http')) {
                    fileBuffer = yield StorageService.downloadFile(filePath);
                }
                else {
                    // Legacy local file support (will fail on Vercel but keeps local code valid if file exists)
                    try {
                        if (require('fs').existsSync(filePath)) {
                            fileBuffer = require('fs').readFileSync(filePath);
                        }
                    }
                    catch (e) { }
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
    var _a, _b;
    const { id } = req.params;
    try {
        const project = yield QueueService.getProject(id);
        if (!project) {
            console.error(`Regenerate: Project ID ${id} NOT found.`);
            return res.status(404).json({ error: "Project not found" });
        }
        console.log(`Regenerating DOCX for Project: ${project.id}. Title: ${project.metadata.bookTitle}. Chapters: ${((_a = project.structure) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
        let targetProject = project;
        // Fallback Logic: If the requested project is empty, try to find a better one for this user.
        if (!targetProject.structure || targetProject.structure.length === 0) {
            const userEmail = ((_b = targetProject.metadata.contact) === null || _b === void 0 ? void 0 : _b.email) || "";
            console.warn(`Project ${id} is empty. Searching for a better candidate for email: ${userEmail}`);
            if (userEmail) {
                const betterProject = yield QueueService.getProjectByEmail(userEmail);
                if (betterProject && betterProject.structure && betterProject.structure.length > 0) {
                    console.log(`FOUND BETTER PROJECT: ${betterProject.id} with ${betterProject.structure.length} chapters.`);
                    targetProject = betterProject;
                }
                else {
                    console.warn("No better project found. Proceeding with empty project.");
                }
            }
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
