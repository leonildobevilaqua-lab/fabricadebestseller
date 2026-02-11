
import { JsonDB, Config } from 'node-json-db';
import { v4 as uuidv4 } from 'uuid';

const db = new JsonDB(new Config("database", true, false, '/'));

const run = async () => {
    try {
        await db.reload();
        // Load RAW to ensure we act on array
        const leads = await db.getData('/leads');

        if (!Array.isArray(leads)) {
            console.log("Leads is not an array");
            return;
        }

        let fixedCount = 0;
        const fixedLeads = leads.map((lead: any) => {
            if (!lead.id) {
                console.log(`Fixing lead without ID: ${lead.email}`);
                fixedCount++;
                return { ...lead, id: uuidv4() };
            }
            return lead;
        });

        if (fixedCount > 0) {
            await db.push('/leads', fixedLeads);
            console.log(`Fixed ${fixedCount} leads with missing IDs.`);
        } else {
            console.log("No leads with missing IDs found.");
        }

    } catch (e) {
        console.error("Error", e);
    }
};

run();
