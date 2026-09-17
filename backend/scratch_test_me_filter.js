const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function testMeFilter() {
    const strUser = 'contato@leonildobevilaqua.com.br'.toLowerCase().trim();
    
    const [allProjects, allLeadsData] = await Promise.all([
        getVal('/projects', { forceSync: true }) || [],
        getVal('/leads', { forceSync: true }) || []
    ]);

    const projectsArray = Array.isArray(allProjects) ? allProjects : Object.values(allProjects);
    const leadsArray = Array.isArray(allLeadsData) ? allLeadsData : Object.values(allLeadsData);

    const combinedProjects = [...projectsArray];
    leadsArray.forEach((l) => {
        const hasProjectData = l.bookTitle || l.topic || l.projectId;
        const isBookLead = (l.type === 'BOOK' && hasProjectData) || hasProjectData;
        const alreadyInProjects = combinedProjects.some((p) => (p.id || p.projectId) === (l.id || l.projectId));
        if (isBookLead && !alreadyInProjects) {
            combinedProjects.push(l);
        }
    });

    const enrichedProjects = combinedProjects.map((p) => {
        const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
        let customerEmail = (
            p.customerEmail || p.email || p.userEmail || 
            metadata.contact?.email || 
            metadata.email || 
            metadata.userEmail || 
            ""
        ).trim().toLowerCase();

        return {
            ...p,
            customerEmail: customerEmail || "n/a"
        };
    });

    // NEW FILTER (Only user's own projects)
    const userProjects = enrichedProjects.filter((p) => {
        return p.customerEmail === strUser;
    });

    console.log(`=== VIP ME FILTER TEST ===`);
    console.log(`Logged in user: ${strUser}`);
    console.log(`Total projects in DB: ${enrichedProjects.length}`);
    console.log(`Projects for ${strUser}: ${userProjects.length}`);
    
    console.log('\n--- BOOKS BELONGING TO LEONILDO ---');
    userProjects.forEach((p, idx) => {
        const metadata = p.metadata || p;
        const title = metadata.bookTitle || p.bookTitle || metadata.title || p.title || metadata.topic || p.topic;
        console.log(`${idx + 1}. [ID: ${p.id || metadata.id}] Title: "${title}" | Author: ${metadata.authorName || p.authorName || 'N/A'}`);
    });
}

testMeFilter().catch(console.error);
