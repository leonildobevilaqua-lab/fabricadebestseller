import { getVal } from './src/services/db.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    let start = Date.now();
    console.log("Fetching /leads...");
    const leads = await getVal('/leads');
    console.log(`Leads count: ${leads ? leads.length : 0} (took ${Date.now() - start}ms)`);

    start = Date.now();
    console.log("Fetching /projects...");
    const projects = await getVal('/projects');
    console.log(`Projects count: ${projects ? projects.length : 0} (took ${Date.now() - start}ms)`);
}
run();
