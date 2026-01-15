
import * as QueueService from './src/services/queue.service';
import * as DocService from './src/services/doc.service';
import { supabase } from './src/services/supabase';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

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

async function recoverBatch2() {
    console.log("Starting Batch 2 Recovery...");

    const recoveryDir = path.join(__dirname, 'generated_books', 'RECUPERADOS_LOTE_2');
    if (!fs.existsSync(recoveryDir)) fs.mkdirSync(recoveryDir, { recursive: true });

    for (const titleQuery of TARGET_TITLES) {
        console.log(`\nSearching for: "${titleQuery}"...`);

        // Find project by title (fuzzy)
        const { data: projects, error } = await supabase
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
            const project = await QueueService.getProject(projectData.id);
            if (!project) continue;

            // Generate DOCX
            console.log(`   Generating DOCX...`);
            const docPath = await DocService.generateBookDocx(project);

            // Artifact Handling
            const safeTitle = (project.metadata.bookTitle || 'Sem_Titulo').replace(/[^a-zA-Z0-9\u00C0-\u00FF -]/g, '').trim();
            const docDir = path.dirname(docPath);
            const zipName = `kit_completo_project_${project.id}.zip`;
            const zipPath = path.join(docDir, zipName);

            if (fs.existsSync(zipPath)) {
                const targetZip = path.join(recoveryDir, `${safeTitle}_COMPLETO.zip`);
                fs.copyFileSync(zipPath, targetZip);
                console.log(`   -> Archived ZIP`);
            } else if (fs.existsSync(docPath)) {
                const targetDoc = path.join(recoveryDir, `${safeTitle}.docx`);
                fs.copyFileSync(docPath, targetDoc);
                console.log(`   -> Archived DOCX`);
            }

        } catch (e) {
            console.error(`   ❌ Error recovering:`, e);
        }
    }

    console.log("\nZipping Batch 2...");

    const zipName = 'PACOTE_LIVROS_RECUPERADOS_2.zip';
    const outputPath = path.join(__dirname, 'generated_books', zipName);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        console.log(`Batch 2 Ready: ${zipName}`);
        console.log('Bytes: ' + archive.pointer());
    });

    archive.pipe(output);
    archive.directory(recoveryDir, false);
    await archive.finalize();
}

recoverBatch2();
