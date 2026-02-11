import { getVal, setVal } from '../services/db.service';

const email = 'contato@leonildobevilaqua.com.br';

const run = async () => {
    console.log(`Resetting plan for ${email}...`);
    try {
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        let found = false;
        for (const l of leads) {
            if ((l as any).email?.toLowerCase().trim() === email.toLowerCase().trim()) {
                console.log("Updating lead:", (l as any).id, (l as any).status);
                if ((l as any).status === 'SUBSCRIBER' || (l as any).status === 'APPROVED' || (l as any).status === 'IN_PROGRESS') {
                    // Resetting status but keeping 'IN_PROGRESS' if we want to test 'usageCount'.
                    // Actually user wants to test subscription flow.
                    // If status is IN_PROGRESS, usageCount is 1.
                    // I'll set status to 'PENDING'.
                    (l as any).status = 'PENDING';
                    found = true;
                }
            }
        }
        if (found) await setVal('/leads', leads);

        // User Plan
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        await setVal(`/users/${safeEmail}/plan`, null);

        console.log("Reset Complete.");
    } catch (e) { console.error(e); }
    process.exit(0);
}

run();
