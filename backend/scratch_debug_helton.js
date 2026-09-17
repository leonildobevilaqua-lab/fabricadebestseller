const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function debugHelton() {
    const projects = await getVal('/projects', { forceSync: true });
    console.log('Total projects in getVal (forceSync):', projects ? projects.length : 0);

    const heltonProj = projects.find(p => JSON.stringify(p).toLowerCase().includes('helton'));
    if (heltonProj) {
        console.log('\nFound Helton Project object keys:', Object.keys(heltonProj));
        console.log('heltonProj.metadata:', heltonProj.metadata);
        console.log('heltonProj.contact:', heltonProj.contact);
        console.log('heltonProj.customerEmail:', heltonProj.customerEmail);
        console.log('heltonProj.email:', heltonProj.email);
    } else {
        console.log('No Helton project found in projects list');
    }
}

debugHelton().catch(console.error);
