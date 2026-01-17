
import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("database", true, false, '/'));

const run = async () => {
    try {
        await db.reload();
        const leads = await db.getData('/leads');

        if (!Array.isArray(leads)) {
            console.log("Leads is not an array");
            return;
        }

        console.log(`Total leads before cleanup: ${leads.length}`);

        // FILTER: Keep leads that are NOT (Name == 'Manual Grant' AND Date is missing/invalid)
        const validLeads = leads.filter((lead: any) => {
            const isManualGrant = lead.name === 'Manual Grant';
            const hasInvalidDate = !lead.date || lead.date === 'Invalid Date';

            if (isManualGrant && hasInvalidDate) {
                console.log(`Deleting corrupt lead: ${lead.email} - ${lead.name}`);
                return false; // Remove
            }
            return true; // Keep
        });

        console.log(`Total leads after cleanup: ${validLeads.length}`);

        // Save back
        await db.push('/leads', validLeads);
        console.log("Database updated successfully.");

    } catch (e) {
        console.error("Error", e);
    }
};

run();
