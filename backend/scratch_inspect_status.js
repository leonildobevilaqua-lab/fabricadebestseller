const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });
const { getVal } = require(path.join(backendDir, 'dist/src/services/db.service'));

async function inspectProjectStatuses() {
    const projects = await getVal('/projects', { forceSync: true });
    console.log('Total projects:', projects ? projects.length : 0);

    const statusCounts = {};
    const sampleByStatus = {};

    projects.forEach((p, idx) => {
        const metadataStatus = p.metadata?.status;
        const topStatus = p.status;
        const effectiveStatus = metadataStatus || topStatus || 'NO_STATUS';

        statusCounts[effectiveStatus] = (statusCounts[effectiveStatus] || 0) + 1;
        if (!sampleByStatus[effectiveStatus]) {
            sampleByStatus[effectiveStatus] = {
                id: p.id,
                title: p.metadata?.bookTitle || p.bookTitle || p.title,
                metadataStatus: metadataStatus,
                topStatus: topStatus,
                keys: Object.keys(p),
                metadataKeys: p.metadata ? Object.keys(p.metadata) : null
            };
        }
    });

    console.log('\n--- STATUS COUNTS IN 277 PROJECTS ---');
    console.table(statusCounts);

    console.log('\n--- SAMPLES BY STATUS ---');
    console.log(JSON.stringify(sampleByStatus, null, 2));
}

inspectProjectStatuses().catch(console.error);
