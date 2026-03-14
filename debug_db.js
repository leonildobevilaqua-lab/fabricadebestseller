
const { getVal } = require('./backend/src/services/db.service');
const dotenv = require('dotenv');
dotenv.config({ path: './backend/.env' });

async function test() {
    console.log("Testing getVal('/projects')...");
    const projects = await getVal('/projects');
    console.log("Total projects returned:", projects?.length);
    if (projects && projects.length > 0) {
        console.log("First project keys:", Object.keys(projects[0]));
        console.log("First project metadata keys:", projects[0].metadata ? Object.keys(projects[0].metadata) : "N/A");
        
        const user = 'contato@leonildobevilaqua.com.br';
        const filtered = projects.filter(p => p.metadata?.contact?.email?.toLowerCase().trim() === user);
        console.log(`Filtered for ${user}:`, filtered.length);
    }
}

test().catch(console.error);
