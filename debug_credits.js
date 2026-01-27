
const { getVal } = require('./backend/dist/services/db.service');
const path = require('path');

// Mock specific logic to load DB if needed, but db.service usually handles it.
// However, db.service might rely on relative paths.
// Let's assume we run this from project root.

async function check() {
    try {
        console.log("Checking DB...");
        // Modify db.service path to force absolute if needed or rely on default
        // Actually, importing from dist/services/db.service should work if we run node from root.

        const bypass = await getVal('/settings/payment_bypass');
        console.log('Payment Bypass:', bypass);

        const credits = await getVal('/credits');
        console.log('Credits:', JSON.stringify(credits, null, 2));

        const users = await getVal('/users');
        // console.log('Users:', Object.keys(users || {}));

    } catch (e) {
        console.error(e);
    }
}

check();
