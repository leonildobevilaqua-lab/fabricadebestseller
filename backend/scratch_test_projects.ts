import { getVal } from './src/services/db.service';
import { supabase } from './src/services/supabase';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    try {
        console.log("Fetching /projects...");
        const projects = await getVal('/projects', { forceSync: true });
        console.log(`Fetched ${projects ? projects.length : 0} projects`);
        
        console.log("Fetching /leads...");
        const leads = await getVal('/leads', { forceSync: true });
        console.log(`Fetched ${leads ? leads.length : 0} leads`);
        
        console.log("Fetching /orders...");
        const orders = await getVal('/orders', { forceSync: true });
        console.log(`Fetched ${orders ? orders.length : 0} orders`);
        
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
