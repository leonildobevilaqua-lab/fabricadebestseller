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
const QueueService = __importStar(require("./src/services/queue.service"));
const DocService = __importStar(require("./src/services/doc.service"));
const supabase_1 = require("./src/services/supabase");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const TARGET_TITLES = [
    "A Verdadeira História de Jesus",
    "Da Mesada ao Milhão", // Partial for fuzzy match
    "IA Descomplicada para o Seu Negócio",
    "A Casa de Doces e o Cofrinho Mágico",
    "A Magia das Cores em Pixel Art",
    "Emagreça Comendo o Que Ama",
    "O Código da Abundância Esotérica",
    "A Bíblia do Tráfego Pago",
    "R$100 Podem Mudar Sua Vida Financeira",
    "Numerologia Cabalística"
];
function recoverBatch2() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting Batch 2 Recovery...");
        const recoveryDir = path.join(__dirname, 'generated_books', 'RECUPERADOS_LOTE_2');
        if (!fs.existsSync(recoveryDir))
            fs.mkdirSync(recoveryDir, { recursive: true });
        for (const titleQuery of TARGET_TITLES) {
            console.log(`\nSearching for: "${titleQuery}"...`);
            // Find project by title (fuzzy)
            const { data: projects, error } = yield supabase_1.supabase
                .from('projects')
                .select('*')
                .ilike('book_title', `%${titleQuery}%`)
                .order('created_at', { ascending: false })
                .limit(1);
            if (error || !projects || projects.length === 0) {
                console.error(`❌ Project NOT FOUND for query: "${titleQuery}"`);
                continue;
            }
            const projectData = projects[0];
            console.log(`✅ Found: "${projectData.book_title}" (ID: ${projectData.id})`);
            try {
                // Get full object via QueueService to ensure correct structure mapping
                const project = yield QueueService.getProject(projectData.id);
                if (!project)
                    continue;
                // Generate DOCX
                console.log(`   Generating DOCX...`);
                const docPath = yield DocService.generateBookDocx(project);
                // Artifact Handling
                const safeTitle = (project.metadata.bookTitle || 'Sem_Titulo').replace(/[^a-zA-Z0-9\u00C0-\u00FF -]/g, '').trim();
                const docDir = path.dirname(docPath);
                const zipName = `kit_completo_project_${project.id}.zip`;
                const zipPath = path.join(docDir, zipName);
                if (fs.existsSync(zipPath)) {
                    const targetZip = path.join(recoveryDir, `${safeTitle}_COMPLETO.zip`);
                    fs.copyFileSync(zipPath, targetZip);
                    console.log(`   -> Archived ZIP`);
                }
                else if (fs.existsSync(docPath)) {
                    const targetDoc = path.join(recoveryDir, `${safeTitle}.docx`);
                    fs.copyFileSync(docPath, targetDoc);
                    console.log(`   -> Archived DOCX`);
                }
            }
            catch (e) {
                console.error(`   ❌ Error recovering:`, e);
            }
        }
        console.log("\nZipping Batch 2...");
        const zipName = 'PACOTE_LIVROS_RECUPERADOS_2.zip';
        const outputPath = path.join(__dirname, 'generated_books', zipName);
        const output = fs.createWriteStream(outputPath);
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        output.on('close', function () {
            console.log(`Batch 2 Ready: ${zipName}`);
            console.log('Bytes: ' + archive.pointer());
        });
        archive.pipe(output);
        archive.directory(recoveryDir, false);
        yield archive.finalize();
    });
}
recoverBatch2();
