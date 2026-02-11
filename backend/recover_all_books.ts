
import * as QueueService from './src/services/queue.service';
import * as DocService from './src/services/doc.service';
import * as fs from 'fs';
import * as path from 'path';
import archiver from 'archiver';

const TARGET_IDS = [
    '780056b0-f4ec-4146-af99-523217ca7d06', // O Desbloqueio da Mente Infantil
    '2cc588af-ad5b-4b82-b5ef-4829d7a3d6b6', // O Guia Definitivo do Investidor
    '91d3e8a6-fd32-4814-aa56-865e07886a15', // Desligue a Mente Ansiosa
    '672dea47-6c0d-4751-bfd5-257d8de32b45'  // Anúncios que Vendem
];

async function recoverAll() {
    console.log("Starting Batch Recovery...");

    // Create a directory for this batch
    const recoveryDir = path.join(__dirname, 'generated_books', 'RECUPERADOS_DO_LEONILDO');
    if (!fs.existsSync(recoveryDir)) fs.mkdirSync(recoveryDir, { recursive: true });

    for (const id of TARGET_IDS) {
        try {
            console.log(`\nProcessing Project ID: ${id}...`);
            const project = await QueueService.getProject(id);
            if (!project) {
                console.error(`Project ${id} not found.`);
                continue;
            }

            console.log(`Found: ${project.metadata.bookTitle}`);

            // Generate DOCX (returns path)
            const docPath = await DocService.generateBookDocx(project);

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
            } else if (fs.existsSync(originalDoc)) {
                const targetDoc = path.join(recoveryDir, `${targetNameBase}.docx`);
                fs.copyFileSync(originalDoc, targetDoc);
                console.log(`Copied DOCX to: ${targetDoc}`);
            }

        } catch (e) {
            console.error(`Error recovering ${id}:`, e);
        }
    }

    console.log("\nAll processed. Creating Mega-Zip...");

    // Create ZIP of the recovery dir
    const output = fs.createWriteStream(path.join(__dirname, 'generated_books', 'PACOTE_LIVROS_RECUPERADOS.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', function () {
        console.log('Mega-Zip Created: PACOTE_LIVROS_RECUPERADOS.zip');
        console.log('Total bytes: ' + archive.pointer());
    });

    archive.pipe(output);
    archive.directory(recoveryDir, false);
    await archive.finalize();
}

recoverAll();
