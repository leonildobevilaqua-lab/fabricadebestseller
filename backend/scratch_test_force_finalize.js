const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function inspectProjectDetails() {
    const ids = [
        '427cd675-c808-4474-9709-e167fde912ca', // Josinaldo
        '82497900-431d-4018-8388-57a8b1f989fd', // Doutor Biomed
        '899474c8-98d0-4bc4-a1a7-3dd4b60a6f74'  // Adalberto
    ];

    for (const id of ids) {
        console.log(`\n================ INSPECTING ID: ${id} ================`);
        const proj = await getVal(`/projects/${id}`, { forceSync: true });
        if (proj) {
            console.log('Found in /projects/');
            console.log('  Keys:', Object.keys(proj));
            console.log('  Title:', proj.title || proj.bookTitle || proj.metadata?.bookTitle);
            console.log('  Status:', proj.status || proj.metadata?.status);
            console.log('  Progress:', proj.progress || proj.metadata?.progress);
            console.log('  Structure length:', Array.isArray(proj.structure) ? proj.structure.length : 'No structure');
        } else {
            console.log('NOT FOUND in /projects/');
            const leads = await getVal('/leads', { forceSync: true }) || [];
            const lead = leads.find(l => l.id === id || l.projectId === id);
            if (lead) {
                console.log('Found in /leads!');
                console.log('  Lead Keys:', Object.keys(lead));
                console.log('  Lead Title:', lead.bookTitle || lead.topic);
                console.log('  Lead Status:', lead.status);
            } else {
                console.log('NOT FOUND in /leads either.');
            }
        }
    }
}

inspectProjectDetails().catch(console.error);
