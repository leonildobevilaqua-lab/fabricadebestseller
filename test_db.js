
const { getVal } = require('./backend/src/services/db.service');
const { initSupabase } = require('./backend/src/services/supabase');

async function test() {
    console.log("Initializing Supabase...");
    // We need to set env vars usually, but let's assume they are in process.env if running via ts-node or similar
    // For this test, I'll just try to call it and see if it works.
    try {
        const projects = await getVal('/projects');
        console.log("Total projects fetched:", projects ? (Array.isArray(projects) ? projects.length : 'Not an array') : 'null');
        if (Array.isArray(projects)) {
            const sample = projects[0];
            console.log("Sample project key:", sample.id || sample.key || 'N/A');
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
