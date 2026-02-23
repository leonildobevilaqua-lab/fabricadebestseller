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
const QueueService = __importStar(require("./src/services/queue.service"));
const AIService = __importStar(require("./src/services/ai.service"));
const DocService = __importStar(require("./src/services/doc.service"));
function resume() {
    return __awaiter(this, void 0, void 0, function* () {
        const email = 'contato@leonildobevilaqua.com.br';
        console.log(`Looking for project for ${email}...`);
        // Get project
        const project = yield QueueService.getProjectByEmail(email);
        if (!project) {
            console.error("No project found!");
            process.exit(1);
        }
        console.log(`Found Project: ${project.id}`);
        console.log(`Title: ${project.metadata.bookTitle}`);
        console.log(`Count: ${project.structure.length} chapters.`);
        // Force Metadata status to ensure UI shows progress
        yield QueueService.updateMetadata(project.id, {
            status: 'WRITING_CHAPTERS',
            progress: 50,
            statusMessage: "Retomando inteligência para finalizar capítulos..."
        });
        const chapters = project.structure;
        let modified = false;
        // Loop chapters
        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            // Skip Introduction if ID is 0 (handled later)
            if (chapter.id === 0)
                continue;
            // Check if validated
            const hasContent = chapter.content && chapter.content.length > 500;
            if (!hasContent) {
                console.log(`>>> Writing Chapter ${chapter.id}: ${chapter.title}...`);
                try {
                    // Ensure metadata has language
                    project.metadata.language = 'pt';
                    const content = yield AIService.writeChapter(project.metadata, chapter, chapters, project.researchContext);
                    chapter.content = content;
                    chapter.isGenerated = true;
                    modified = true;
                    // Save immediately
                    yield QueueService.updateProject(project.id, { structure: chapters });
                    // Update progress
                    const p = 50 + Math.floor((i / chapters.length) * 40);
                    yield QueueService.updateMetadata(project.id, {
                        progress: p,
                        statusMessage: `Escrevendo Capítulo ${chapter.id}...`
                    });
                }
                catch (e) {
                    console.error(`Failed to write chapter ${chapter.id}:`, e);
                }
            }
            else {
                console.log(`[OK] Chapter ${chapter.id} exists.`);
            }
        }
        // Now Marketing and Completion if we actually finished
        console.log("Applying final touches...");
        // Intro
        if (!project.structure.find(c => c.id === 0)) {
            console.log("Writing Intro...");
            const intro = yield AIService.writeIntroduction(project.metadata, chapters, project.researchContext, 'pt');
            project.structure.unshift({ id: 0, title: "Introdução", content: intro, isGenerated: true });
            yield QueueService.updateProject(project.id, { structure: project.structure });
        }
        // Marketing matching controller logic
        if (!project.marketing || !project.marketing.salesSynopsis) {
            console.log("Generating Marketing...");
            const marketing = yield AIService.generateMarketing(project.metadata, project.researchContext, project.structure, 'pt');
            yield QueueService.updateProject(project.id, { marketing });
        }
        // Finalize
        yield QueueService.updateMetadata(project.id, {
            status: 'COMPLETED',
            progress: 100,
            statusMessage: "Livro Completo! Gerando arquivo..."
        });
        // Generate Doc
        yield DocService.generateBookDocx(project);
        console.log("Done! Book should be fully recovered.");
        process.exit(0);
    });
}
resume();
