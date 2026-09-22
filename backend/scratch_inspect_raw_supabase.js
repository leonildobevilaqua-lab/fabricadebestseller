const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const backendDir = 'c:/Users/Pichau/OneDrive/FERRAMENTAS - PROFISSIONAIS/bestseller-factory-ai/backend';
require(path.join(backendDir, 'node_modules/dotenv')).config({ path: path.join(backendDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function inspectRawSupabase() {
    console.log('--- SEARCHING SUPABASE DIRECTLY FOR JOSINALDO, DOUTORBIOMED, ADALBERTO ---');

    const targets = ['josinaldo', 'doutorbiomed', 'adalberto'];

    for (const term of targets) {
        const { data, error } = await supabase
            .from('kv_store')
            .select('key, value, updated_at')
            .gte('key', '/projects/')
            .lt('key', '/projects0')
            .ilike('value::text', `%${term}%`);

        console.log(`\nMatches for "${term}": ${data ? data.length : 0} (Error: ${error?.message || 'none'})`);
        if (data && data.length > 0) {
            data.forEach(item => {
                let val = item.value;
                if (typeof val === 'string') { try { val = JSON.parse(val); } catch(e){} }
                console.log('  Key:', item.key);
                console.log('  Top-level keys in value:', Object.keys(val || {}));
                console.log('  Title:', val.title || val.bookTitle || val.metadata?.bookTitle || val.metadata?.title);
                console.log('  Contact:', val.contact || val.metadata?.contact);
                console.log('  Status:', val.status || val.metadata?.status);
                console.log('  Progress:', val.progress || val.metadata?.progress);
                console.log('  CurrentStep:', val.currentStep || val.metadata?.currentStep);
            });
        }
    }
}

inspectRawSupabase().catch(console.error);
