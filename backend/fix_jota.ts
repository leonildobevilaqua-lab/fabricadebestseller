import { getVal, setVal } from './src/services/db.service';

async function fixUser() {
    const email = 'jota-erre1962@uol.com.br';
    const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

    // Check credits
    const credits = (await getVal(`/credits/${safeEmail}`)) || 0;
    console.log("Current credits:", credits);

    // Give 1 credit if not already having one
    if (credits < 1) {
        await setVal(`/credits/${safeEmail}`, credits + 1);
        console.log("Credits updated to:", credits + 1);
    }

    // Assign a legacy basic plan for unlocking content visually if needed
    const plan = await getVal(`/users/${safeEmail}/plan`);
    console.log("Current Plan:", plan);
    if (!plan || plan.status !== 'ACTIVE') {
        await setVal(`/users/${safeEmail}/plan`, {
            name: 'BLACK',
            status: 'ACTIVE',
            billing: 'avulso',
            provider: 'ASAAS',
            updatedAt: new Date().toISOString()
        });
        console.log("Plan setup to BLACK for benefits");
    }
}

fixUser().then(() => {
    console.log('Finished');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
