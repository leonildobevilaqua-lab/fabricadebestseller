const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspectRawSupabase() {
    console.log('--- FETCHING ALL KV_STORE ROWS TO SEARCH IN JS ---');

    let allRows = [];
    let from = 0;
    let limit = 1000;

    while (true) {
        const { data, error } = await supabase
            .from('kv_store')
            .select('key, value, updated_at')
            .range(from, from + limit - 1);

        if (error) {
            console.error('Error fetching range:', from, error);
            break;
        }
        if (!data || data.length === 0) break;
        allRows.push(...data);
        console.log(`Fetched ${data.length} rows (total so far: ${allRows.length})`);
        if (data.length < limit) break;
        from += limit;
    }

    console.log(`\nTotal rows in kv_store: ${allRows.length}`);

    const targets = ['josinaldo', 'doutorbiomed', 'adalberto', 'helton90pbs'];

    targets.forEach(term => {
        const matches = allRows.filter(r => JSON.stringify(r).toLowerCase().includes(term));
        console.log(`\n=== MATCHES FOR "${term}" (${matches.length}) ===`);
        matches.forEach((m, idx) => {
            console.log(`Match #${idx + 1}: Key: ${m.key}`);
            let val = m.value;
            if (typeof val === 'string') { try { val = JSON.parse(val); } catch(e){} }
            console.log('  Keys in value:', Object.keys(val || {}));
            console.log('  Title:', val.title || val.bookTitle || val.metadata?.bookTitle || val.metadata?.title);
            console.log('  Status:', val.status || val.metadata?.status);
            console.log('  Progress:', val.progress || val.metadata?.progress);
            console.log('  Contact:', val.contact || val.metadata?.contact || val.email || val.payerEmail);
            console.log('  Metadata:', val.metadata ? 'Object present' : 'None');
        });
    });
}

inspectRawSupabase().catch(console.error);
