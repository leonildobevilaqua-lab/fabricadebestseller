const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function checkScreenshotProjects() {
    const projects = await getVal('/projects', { forceSync: true });
    
    const targets = [
        'josinaldoviananeves@gmail.com',
        'doutorbiomed@gmail.com',
        'adalbertomarqueshoffmann@gmail.com'
    ];

    targets.forEach(email => {
        const found = projects.filter(p => JSON.stringify(p).toLowerCase().includes(email.toLowerCase()));
        console.log(`\n=== PROJECTS FOR ${email} (${found.length} found) ===`);
        found.forEach((p, idx) => {
            console.log(`\nProject #${idx + 1}:`);
            console.log('  ID:', p.id);
            console.log('  Title:', p.metadata?.bookTitle || p.bookTitle || p.title);
            console.log('  Top Status:', p.status);
            console.log('  Metadata Status:', p.metadata?.status);
            console.log('  CurrentStep:', p.currentStep || p.metadata?.currentStep);
            console.log('  Progress:', p.progress || p.metadata?.progress);
            console.log('  Has structure:', Array.isArray(p.structure) ? p.structure.length : 'No structure');
            if (Array.isArray(p.structure) && p.structure.length > 0) {
                console.log('  Sample chapter 0 text len:', p.structure[0].content ? p.structure[0].content.length : (p.structure[0].text ? p.structure[0].text.length : 0));
            }
        });
    });
}

checkScreenshotProjects().catch(console.error);
