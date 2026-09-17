const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function testStatusFix() {
    const [allProjects, allLeadsData] = await Promise.all([
        getVal('/projects', { forceSync: true }) || [],
        getVal('/leads', { forceSync: true }) || []
    ]);

    const projectsArray = Array.isArray(allProjects) ? allProjects : Object.values(allProjects);
    const leadsArray = Array.isArray(allLeadsData) ? allLeadsData : Object.values(allLeadsData);

    console.log(`Raw Projects count: ${projectsArray.length}`);
    console.log(`Raw Leads count: ${leadsArray.length}`);

    // Helper: Determine if a project/lead is COMPLETED
    function getEffectiveStatus(p) {
        const metadata = p.metadata || p;
        const rawStatus = (metadata.status || p.status || '').toUpperCase();
        
        const isExplicitDone = ['COMPLETED', 'LIVRO ENTREGUE', 'READY', 'SUCCESS', 'READY_TO_DOWNLOAD', 'DONE', 'FINISHED', 'APPROVED'].includes(rawStatus);
        if (isExplicitDone) return 'COMPLETED';

        const structure = p.structure || metadata.structure;
        const hasStructure = Array.isArray(structure) && structure.length > 0;
        const hasContent = hasStructure && structure.some(ch => ch.content || ch.text || ch.isGenerated);
        const isProgressFull = (p.progress >= 100 || metadata.progress >= 100);
        const isStepDone = (p.currentStep === 'DONE' || metadata.currentStep === 'DONE' || p.currentStep === 'DETAILS' || metadata.currentStep === 'DETAILS');

        if (hasContent || isProgressFull || isStepDone) {
            return 'COMPLETED';
        }

        return rawStatus || 'IN_PROGRESS';
    }

    // Merge logic
    const combined = [...projectsArray];
    leadsArray.forEach((l) => {
        const hasProjectData = l.bookTitle || l.topic || l.projectId;
        const isBookLead = (l.type === 'BOOK' && hasProjectData) || hasProjectData;
        const lEmail = (l.email || l.customerEmail || '').toLowerCase().trim();

        // Match by ID, projectId, OR matching project by email that already exists
        const alreadyIn = combined.some((p) => {
            const pId = p.id || p.projectId || p.metadata?.id;
            const pEmail = (p.customerEmail || p.email || p.metadata?.contact?.email || '').toLowerCase().trim();
            return (pId && (pId === l.id || pId === l.projectId)) || (lEmail && pEmail && lEmail === pEmail);
        });

        if (isBookLead && !alreadyIn) {
            combined.push(l);
        }
    });

    console.log(`Combined timeline count: ${combined.length}`);

    const targets = ['josinaldo', 'doutorbiomed', 'adalberto', 'helton90pbs', 'leonildo'];

    targets.forEach(term => {
        const matches = combined.filter(item => JSON.stringify(item).toLowerCase().includes(term));
        console.log(`\n=== MATCHES FOR "${term}" IN TIMELINE (${matches.length}) ===`);
        matches.forEach((item, idx) => {
            const metadata = item.metadata || item;
            const title = metadata.bookTitle || item.bookTitle || metadata.title || item.title || metadata.topic || item.topic;
            const status = getEffectiveStatus(item);
            console.log(`Item #${idx + 1}:`);
            console.log('  ID:', item.id || item.projectId || metadata.id);
            console.log('  Title:', title);
            console.log('  Email:', item.customerEmail || item.email || metadata.contact?.email);
            console.log('  Effective Status:', status, `(Raw: ${metadata.status || item.status})`);
        });
    });
}

testStatusFix().catch(console.error);
