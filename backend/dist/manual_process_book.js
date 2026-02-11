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
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const QueueService = __importStar(require("./src/services/queue.service"));
const AIService = __importStar(require("./src/services/ai.service"));
const DocService = __importStar(require("./src/services/doc.service"));
// Setup readline
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const ask = (q) => new Promise(resolve => rl.question(q, resolve));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log("==========================================");
        console.log("   MANUAL BOOK GENERATOR (Bestseller AI)  ");
        console.log("==========================================");
        console.log("Este script executa o processo de geração localmente,");
        console.log("evitando timeouts de ambiente Serverless/Produção.\n");
        try {
            const email = yield ask("Digite o EMAIL do usuário (ou ENTER para usar ID): ");
            let project = null;
            if (email.trim()) {
                console.log(`Buscando último projeto para: ${email}...`);
                project = yield QueueService.getProjectByEmail(email.trim());
            }
            else {
                const id = yield ask("Digite o ID do Projeto (UUID): ");
                if (id.trim())
                    project = yield QueueService.getProject(id.trim());
            }
            if (!project) {
                console.error("❌ Projeto não encontrado.");
                process.exit(1);
            }
            console.log(`\n✅ Projeto Carregado: "${project.metadata.bookTitle || project.metadata.topic}"`);
            console.log(`Status Atual: ${project.metadata.status} (${project.metadata.progress}%)`);
            console.log(`ID: ${project.id}`);
            const confirm = yield ask("\nDeseja iniciar/continuar a geração deste projeto? (s/n): ");
            if (confirm.toLowerCase() !== 's')
                process.exit(0);
            // --- STEP 1: RESEARCH ---
            if (project.metadata.status === 'IDLE' || project.metadata.status === 'START' || project.metadata.status === 'RESEARCHING' || project.metadata.status === 'FAILED') {
                const topic = project.metadata.topic;
                const lang = project.metadata.language || 'pt';
                if (!project.researchContext || project.researchContext.length < 100) {
                    console.log("\n[1/4] 📡 Executando Pesquisa (YouTube, Google, Competitors)...");
                    // Simulating the parallel research from controller
                    const yt = yield AIService.researchYoutube(topic, lang);
                    console.log("  - Youtube OK");
                    const google = yield AIService.researchGoogle(topic, yt, lang);
                    console.log("  - Google OK");
                    const comp = yield AIService.analyzeCompetitors(topic, yt + "\n" + google, lang);
                    console.log("  - Competitors OK");
                    const context = `### YOUTUBE:\n${yt}\n### GOOGLE:\n${google}\n### BOOKS:\n${comp}`;
                    yield QueueService.updateProject(project.id, { researchContext: context });
                    console.log("  - Gerando Títulos...");
                    const titles = yield AIService.generateTitleOptions(topic, context, lang);
                    yield QueueService.updateProject(project.id, { titleOptions: titles });
                    yield QueueService.updateMetadata(project.id, {
                        status: 'WAITING_TITLE',
                        progress: 30,
                        statusMessage: "Pesquisa concluída. Aguardando escolha do título."
                    });
                    console.log("✅ Pesquisa Finalizada. Status: WAITING_TITLE");
                    // Reload project
                    project = yield QueueService.getProject(project.id);
                }
                else {
                    console.log("ℹ️ Pesquisa já parece completa. Pulando etapa.");
                }
            }
            // --- STEP 2: WAITING TITLE ---
            if ((project === null || project === void 0 ? void 0 : project.metadata.status) === 'WAITING_TITLE') {
                console.log("\n[2/4] Escolha de Título");
                console.log("O projeto está aguardando escolha de título.");
                console.log("Por favor, acesse o painel frontend para escolher o título,");
                console.log("OU digite o número do título abaixo para forçar escolha:");
                (_a = project.titleOptions) === null || _a === void 0 ? void 0 : _a.forEach((t, i) => {
                    console.log(`${i + 1}. ${t.title} (${t.subtitle})`);
                });
                const choice = yield ask("\nEscolha (número) ou ENTER para sair e esperar usuário: ");
                if (choice.trim()) {
                    const index = parseInt(choice) - 1;
                    if (project.titleOptions && project.titleOptions[index]) {
                        const sel = project.titleOptions[index];
                        yield QueueService.updateMetadata(project.id, {
                            bookTitle: sel.title,
                            subTitle: sel.subtitle,
                            status: 'GENERATING_STRUCTURE', // Jump to next
                            progress: 35
                        });
                        console.log(`✅ Título Definido: ${sel.title}`);
                        // Trigger Structure Gen
                        console.log("  - Gerando Estrutura...");
                        const struct = yield AIService.generateStructure(sel.title, sel.subtitle, project.researchContext, project.metadata.language || 'pt');
                        yield QueueService.updateProject(project.id, { structure: struct });
                        yield QueueService.updateMetadata(project.id, {
                            status: 'REVIEW_STRUCTURE',
                            progress: 40,
                            statusMessage: "Estrutura pronta para revisão."
                        });
                        console.log("✅ Estrutura Gerada.");
                        project = yield QueueService.getProject(project.id);
                    }
                }
                else {
                    console.log("Saindo. Execute novamente após o usuário escolher o título.");
                    process.exit(0);
                }
            }
            // --- STEP 3: WRITING ---
            if ((project === null || project === void 0 ? void 0 : project.metadata.status) === 'REVIEW_STRUCTURE' || (project === null || project === void 0 ? void 0 : project.metadata.status) === 'WRITING_CHAPTERS') {
                if (project.metadata.status === 'REVIEW_STRUCTURE') {
                    const proceed = yield ask("\nStatus é REVIEW_STRUCTURE. O usuário já aprovou? Forçar início da escrita? (s/n): ");
                    if (proceed.toLowerCase() !== 's')
                        process.exit(0);
                }
                console.log("\n[3/4] ✍️ Escrevendo Capítulos...");
                // Reload structure
                const chapters = project.structure || [];
                let updatedChapters = [...chapters];
                // Loop chapters
                for (let i = 0; i < updatedChapters.length; i++) {
                    const chap = updatedChapters[i];
                    if (chap.isGenerated && chap.content && chap.content.length > 500) {
                        console.log(`  - Cap ${chap.id} (${chap.title}): JÁ ESCRITO.`);
                        continue;
                    }
                    console.log(`  - Escrevendo Cap ${chap.id}: ${chap.title}...`);
                    try {
                        const content = yield AIService.writeChapter(project.metadata, chap, updatedChapters, project.researchContext);
                        chap.content = content;
                        chap.isGenerated = true; // IMPORTANT
                        // Save incrementally
                        yield QueueService.updateProject(project.id, { structure: updatedChapters });
                        yield QueueService.updateMetadata(project.id, {
                            status: 'WRITING_CHAPTERS',
                            progress: 40 + Math.floor((i / updatedChapters.length) * 40),
                            statusMessage: `Escrevendo Capítulo ${chap.id}...`
                        });
                    }
                    catch (err) {
                        console.error(`❌ Erro no cap ${chap.id}:`, err.message);
                        const skip = yield ask("Pular este capítulo e continuar? (s/n): ");
                        if (skip.toLowerCase() !== 's')
                            process.exit(1);
                    }
                }
                // Introduction (after chapters)
                console.log("  - Verificando Introdução...");
                const hasIntro = updatedChapters.find((c) => c.id === 0 && c.isGenerated);
                if (!hasIntro) {
                    console.log("  - Escrevendo Introdução...");
                    const introText = yield AIService.writeIntroduction(project.metadata, updatedChapters, project.researchContext, project.metadata.language || 'pt');
                    const introChap = { id: 0, title: "Introdução", intro: "Introdução do livro", content: introText, isGenerated: true };
                    // Add to start if not exists
                    const existingIdx = updatedChapters.findIndex((c) => c.id === 0);
                    if (existingIdx !== -1)
                        updatedChapters[existingIdx] = introChap;
                    else
                        updatedChapters.unshift(introChap);
                    yield QueueService.updateProject(project.id, { structure: updatedChapters });
                }
                // Extras
                console.log("  - Gerando Extras (Dedicatória/Sobre)...");
                try {
                    const extras = yield AIService.generateExtras(project.metadata, "", "", "", project.metadata.language || 'pt');
                    yield QueueService.updateMetadata(project.id, {
                        dedication: extras.dedication,
                        acknowledgments: extras.acknowledgments,
                        aboutAuthor: extras.aboutAuthor
                    });
                }
                catch (e) {
                    console.error("Erro extras (ignorando):", e);
                }
                // Marketing
                console.log("  - Gerando Marketing...");
                const marketing = yield AIService.generateMarketing(project.metadata, project.researchContext, updatedChapters, project.metadata.language || 'pt');
                yield QueueService.updateProject(project.id, { marketing });
                yield QueueService.updateMetadata(project.id, {
                    status: 'COMPLETED',
                    progress: 100,
                    statusMessage: "Livro Concluído! Pronto para Download."
                });
                console.log("\n✅ GERAÇÃO COMPLETA! Status definido como COMPLETED.");
                project = yield QueueService.getProject(project.id);
            }
            // --- STEP 4: DOCX ---
            if ((project === null || project === void 0 ? void 0 : project.metadata.status) === 'COMPLETED' || (project === null || project === void 0 ? void 0 : project.metadata.status) === 'LIVRO ENTREGUE') {
                const genDoc = yield ask("\nGerar arquivo DOCX final agora? (s/n): ");
                if (genDoc.toLowerCase() === 's') {
                    const path = yield DocService.generateBookDocx(project);
                    console.log(`\n📄 Arquivo DOCX salvo em: ${path}`);
                }
            }
        }
        catch (error) {
            console.error("Erro Fatal:", error);
        }
        finally {
            rl.close();
            process.exit(0);
        }
    });
}
main();
