const db = require('./src/services/db.service');

async function fixUser() {
    const email = 'jota-erre1962@uol.com.br';
    const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

    // Check user profile
    const profile = await db.getVal(`/users/${safeEmail}/profile`);
    console.log("Profile:", profile);

    // Check credits
    const credits = await db.getVal(`/credits/${safeEmail}`);
    console.log("Current credits:", credits);

    // Give 1 credit
    await db.setVal(`/credits/${safeEmail}`, (credits || 0) + 1);
    console.log("Credits updated to:", (credits || 0) + 1);

    // Also check if plan is set to BLACK since they get BLACK benefits
    const plan = await db.getVal(`/users/${safeEmail}/plan`);
    console.log("Plan:", plan);
    if (!plan || plan.status !== 'ACTIVE') {
        await db.setVal(`/users/${safeEmail}/plan`, {
            name: 'BLACK',
            status: 'ACTIVE',
            billing: 'avulso',
            provider: 'ASAAS',
            updatedAt: new Date().toISOString()
        });
        console.log("Plan updated to ACTIVE BLACK avulso");
    }
}
fixUser().then(() => console.log('Done')).catch(console.error);
