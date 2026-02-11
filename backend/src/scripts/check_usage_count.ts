import { getVal } from '../services/db.service';

const email = 'contato@leonildobevilaqua.com.br';

const run = async () => {
    try {
        console.log(`Checking usage for ${email}...`);
        const rawLeads = await getVal('/leads') || [];
        const leads = Array.isArray(rawLeads) ? rawLeads : Object.values(rawLeads);

        console.log(`Total Leads: ${leads.length}`);

        let count = 0;
        leads.forEach((l: any) => {
            if (l.email?.toLowerCase().trim() === email.toLowerCase().trim()) {
                console.log(`Lead ${l.id}: Status=${l.status}, Plan=${l.plan?.name}`);
                if (l.status === 'APPROVED' || l.status === 'COMPLETED' || l.status === 'LIVRO ENTREGUE') {
                    count++;
                }
            }
        });

        const usageCount = count; // leads.filter(...)

        console.log(`Calculated Usage Count: ${usageCount}`);

        const cycleIndex = usageCount % 4;
        console.log(`Cycle Index: ${cycleIndex} (Level ${cycleIndex + 1})`);

        // Check Plan Status
        const safeEmail = email.toLowerCase().trim().replace(/\./g, '_');
        const userPlan = await getVal(`/users/${safeEmail}/plan`);
        console.log("User Plan:", userPlan);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
};

run();
