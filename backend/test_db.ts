import { getVal } from './src/services/db.service';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Testing getVal('/leads')...");
    const leads = await getVal('/leads');
    console.log("Leads count:", leads ? leads.length : 'null');
    console.log("First lead:", leads && leads.length > 0 ? leads[0] : 'none');

    console.log("\nTesting getVal('/projects')...");
    const projects = await getVal('/projects');
    console.log("Projects count:", projects ? projects.length : 'null');
}

test();
