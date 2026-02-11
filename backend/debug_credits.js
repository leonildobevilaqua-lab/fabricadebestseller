
const { getVal, reloadDB } = require('./dist/services/db.service');
const path = require('path');

async function check() {
    try {
        console.log("Checking DB...");
        // Ensure we load the DB
        await reloadDB();

        const bypass = await getVal('/settings/payment_bypass');
        console.log('Payment Bypass:', bypass);

        const credits = await getVal('/credits');
        console.log('Credits:', JSON.stringify(credits, null, 2));

    } catch (e) {
        console.error(e);
    }
}

check();
