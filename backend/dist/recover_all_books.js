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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const archiver_1 = __importDefault(require("archiver"));
const TARGET_IDS = [
    '780056b0-f4ec-4146-af99-523217ca7d06', // O Desbloqueio da Mente Infantil
    '2cc588af-ad5b-4b82-b5ef-4829d7a3d6b6', // O Guia Definitivo do Investidor
    '91d3e8a6-fd32-4814-aa56-865e07886a15', // Desligue a Mente Ansiosa
    '672dea47-6c0d-4751-bfd5-257d8de32b45' // Anúncios que Vendem
];
function recoverAll() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting Batch Recovery...");
        // Create a directory for this batch
        const recoveryDir = path.join(__dirname, 'generated_books', 'RECUPERADOS_DO_LEONILDO');
        if (!fs.existsSync(recoveryDir))
            fs.mkdirSync(recoveryDir, { recursive: true });
        for (const id of TARGET_IDS) {
            try {
                console.log(`\nProcessing Project ID: ${id}...`);
                const project = yield QueueService.getProject(id);
                if (!project) {
                    console.error(`Project ${id} not found.`);
                    continue;
                }
                console.log(`Found: ${project.metadata.bookTitle}`);
                // Generate DOCX (returns path)
                const docPath = yield DocService.generateBookDocx(project);
                // Also we have the Logic in generateBookDocx creating a ZIP automatically if marketing exists.
                // But let's Copy the resulting artifacts to our Recovery Dir with nice names.
                const safeTitle = (project.metadata.bookTitle || 'Sem_Titulo').replace(/[^a-zA-Z0-9\u00C0-\u00FF -]/g, '').trim(); // Keep accents and spaces
                // Logic in doc.service uses project.id or safeEmail.
                // Let's rely on finding the file generated.
                const originalDoc = docPath; // This is absolute path from generateBookDocx
                // Check for the ZIP version too
                const docDir = path.dirname(originalDoc);
                const zipName = `kit_completo_project_${project.id}.zip`;
                const zipPath = path.join(docDir, zipName);
                const targetNameBase = `${safeTitle}`;
                if (fs.existsSync(zipPath)) {
                    const targetZip = path.join(recoveryDir, `${targetNameBase}_COMPLETO.zip`);
                    fs.copyFileSync(zipPath, targetZip);
                    console.log(`Copied ZIP to: ${targetZip}`);
                }
                else if (fs.existsSync(originalDoc)) {
                    const targetDoc = path.join(recoveryDir, `${targetNameBase}.docx`);
                    fs.copyFileSync(originalDoc, targetDoc);
                    console.log(`Copied DOCX to: ${targetDoc}`);
                }
            }
            catch (e) {
                console.error(`Error recovering ${id}:`, e);
            }
        }
        console.log("\nAll processed. Creating Mega-Zip...");
        // Create ZIP of the recovery dir
        const output = fs.createWriteStream(path.join(__dirname, 'generated_books', 'PACOTE_LIVROS_RECUPERADOS.zip'));
        const archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
        output.on('close', function () {
            console.log('Mega-Zip Created: PACOTE_LIVROS_RECUPERADOS.zip');
            console.log('Total bytes: ' + archive.pointer());
        });
        archive.pipe(output);
        archive.directory(recoveryDir, false);
        yield archive.finalize();
    });
}
recoverAll();
