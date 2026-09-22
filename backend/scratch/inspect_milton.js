const { getVal } = require('../src/services/db.service');
const { initSupabase } = require('../src/services/supabase');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
    try {
        console.log("Loading database keys...");
        const allProjects = await getVal('/projects') || [];
        const allLeads = await getVal('/leads') || [];
        const allOrders = await getVal('/orders') || [];
        
        const projects = Array.isArray(allProjects) ? allProjects : Object.values(allProjects);
        const leads = Array.isArray(allLeads) ? allLeads : Object.values(allLeads);
        const orders = Array.isArray(allOrders) ? allOrders : Object.values(allOrders);
        
        console.log(`Loaded ${projects.length} projects, ${leads.length} leads, ${orders.length} orders.`);
        
        const term = "milton";
        
        console.log(`\n--- Searching for "${term}" in Leads ---`);
        leads.forEach(l => {
            const str = JSON.stringify(l).toLowerCase();
            if (str.includes(term)) {
                console.log(`Lead ID: ${l.id}, Name: ${l.name}, Email: ${l.email}, ProjectId: ${l.projectId}, Type: ${l.type}`);
            }
        });

        console.log(`\n--- Searching for "${term}" in Orders ---`);
        orders.forEach(o => {
            const str = JSON.stringify(o).toLowerCase();
            if (str.includes(term)) {
                console.log(`Order ID: ${o.id}, Payer: ${o.paymentInfo?.payer}, Email: ${o.email || o.paymentInfo?.payerEmail}, ProjectId: ${o.projectId}`);
            }
        });

        console.log(`\n--- Searching for "${term}" in Projects ---`);
        projects.forEach(p => {
            const str = JSON.stringify(p).toLowerCase();
            if (str.includes(term)) {
                const metadata = p.metadata || p;
                console.log(`Project ID: ${p.id || p.projectId || metadata.id}, Title: ${metadata.bookTitle || p.bookTitle || metadata.title}, Email: ${p.email || p.customerEmail || metadata.email || metadata.userEmail}`);
            }
        });
        
    } catch (e) {
        console.error(e);
    }
}

run();
