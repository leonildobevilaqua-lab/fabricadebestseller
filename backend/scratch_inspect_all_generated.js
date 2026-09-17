const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function checkGeneratedProjects() {
    const projects = await getVal('/projects', { forceSync: true }) || [];
    console.log(`Total projects in /projects: ${projects.length}`);

    let completedCount = 0;
    let hasChaptersButNotCompleted = 0;
    const fixableProjects = [];

    projects.forEach((p) => {
        const metadata = p.metadata || p;
        const currentStatus = (metadata.status || p.status || '').toUpperCase();
        const isAlreadyMarkedDone = ['COMPLETED', 'LIVRO ENTREGUE', 'READY', 'SUCCESS', 'READY_TO_DOWNLOAD', 'DONE', 'FINISHED'].includes(currentStatus);

        const structure = p.structure || metadata.structure;
        const hasStructure = Array.isArray(structure) && structure.length > 0;
        const hasGeneratedChapters = hasStructure && structure.some((ch) => ch.content || ch.text || ch.isGenerated);
        const isProgressFull = (p.progress >= 100 || metadata.progress >= 100);
        const isStepDone = (p.currentStep === 'DONE' || metadata.currentStep === 'DONE' || p.currentStep === 'DETAILS' || metadata.currentStep === 'DETAILS');

        if (isAlreadyMarkedDone) {
            completedCount++;
        } else if (hasGeneratedChapters || isProgressFull || isStepDone) {
            hasChaptersButNotCompleted++;
            fixableProjects.push({
                id: p.id || metadata.id,
                title: metadata.bookTitle || p.bookTitle || metadata.title || p.title,
                currentStatus: currentStatus,
                hasStructure: hasStructure,
                chapterCount: hasStructure ? structure.length : 0,
                email: metadata.contact?.email || p.contact?.email || p.customerEmail || p.email
            });
        }
    });

    console.log(`\nAlready marked completed: ${completedCount}`);
    console.log(`Has chapters/structure but status NOT marked completed: ${hasChaptersButNotCompleted}`);

    if (fixableProjects.length > 0) {
        console.log('\n--- SAMPLE FIXABLE PROJECTS ---');
        console.log(JSON.stringify(fixableProjects.slice(0, 15), null, 2));
    }
}

checkGeneratedProjects().catch(console.error);
