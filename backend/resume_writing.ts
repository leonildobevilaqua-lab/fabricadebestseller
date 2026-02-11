
import * as QueueService from './src/services/queue.service';
import * as AIService from './src/services/ai.service';
import * as DocService from './src/services/doc.service';

async function resume() {
    const email = 'contato@leonildobevilaqua.com.br';
    console.log(`Looking for project for ${email}...`);

    // Get project
    const project = await QueueService.getProjectByEmail(email);

    if (!project) {
        console.error("No project found!");
        process.exit(1);
    }

    console.log(`Found Project: ${project.id}`);
    console.log(`Title: ${project.metadata.bookTitle}`);
    console.log(`Count: ${project.structure.length} chapters.`);

    // Force Metadata status to ensure UI shows progress
    await QueueService.updateMetadata(project.id, {
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
        if (chapter.id === 0) continue;

        // Check if validated
        const hasContent = chapter.content && chapter.content.length > 500;

        if (!hasContent) {
            console.log(`>>> Writing Chapter ${chapter.id}: ${chapter.title}...`);
            try {
                // Ensure metadata has language
                project.metadata.language = 'pt';

                const content = await AIService.writeChapter(project.metadata, chapter, chapters, project.researchContext);
                chapter.content = content;
                chapter.isGenerated = true;
                modified = true;

                // Save immediately
                await QueueService.updateProject(project.id, { structure: chapters });

                // Update progress
                const p = 50 + Math.floor((i / chapters.length) * 40);
                await QueueService.updateMetadata(project.id, {
                    progress: p,
                    statusMessage: `Escrevendo Capítulo ${chapter.id}...`
                });

            } catch (e) {
                console.error(`Failed to write chapter ${chapter.id}:`, e);
            }
        } else {
            console.log(`[OK] Chapter ${chapter.id} exists.`);
        }
    }

    // Now Marketing and Completion if we actually finished
    console.log("Applying final touches...");

    // Intro
    if (!project.structure.find(c => c.id === 0)) {
        console.log("Writing Intro...");
        const intro = await AIService.writeIntroduction(project.metadata, chapters, project.researchContext, 'pt');
        project.structure.unshift({ id: 0, title: "Introdução", content: intro, isGenerated: true } as any);
        await QueueService.updateProject(project.id, { structure: project.structure });
    }

    // Marketing matching controller logic
    if (!project.marketing || !project.marketing.salesSynopsis) {
        console.log("Generating Marketing...");
        const marketing = await AIService.generateMarketing(project.metadata, project.researchContext, project.structure, 'pt');
        await QueueService.updateProject(project.id, { marketing });
    }

    // Finalize
    await QueueService.updateMetadata(project.id, {
        status: 'COMPLETED',
        progress: 100,
        statusMessage: "Livro Completo! Gerando arquivo..."
    });

    // Generate Doc
    await DocService.generateBookDocx(project);
    console.log("Done! Book should be fully recovered.");
    process.exit(0);
}

resume();
