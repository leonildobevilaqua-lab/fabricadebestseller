const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testGetVal() {
    console.log('--- TEST 1: FETCHING /leads FROM SUPABASE ---');
    // Test current db.service.ts logic for /leads
    const { data: rawLeads, error: leadsErr } = await supabase
        .from('kv_store')
        .select('key, updated_at, value')
        .gte('key', '/leads/')
        .lt('key', '/leads0')
        .limit(2000);

    console.log('Current db.service.ts query for /leads count:', rawLeads ? rawLeads.length : 0);

    // Test correct query for /leads (checking key = "/leads" or key like "/leads%")
    const { data: rootLeadData } = await supabase.from('kv_store').select('key, value, updated_at').eq('key', '/leads').maybeSingle();
    console.log('Root /leads key found:', !!rootLeadData);
    if (rootLeadData && rootLeadData.value) {
        const leadsArray = Array.isArray(rootLeadData.value) ? rootLeadData.value : Object.values(rootLeadData.value);
        console.log('Actual leads count in root /leads key:', leadsArray.length);
    }

    console.log('\n--- TEST 2: FETCHING /projects FROM SUPABASE ---');
    // Test current db.service.ts query for /projects
    const { data: rawProjects } = await supabase
        .from('kv_store')
        .select('key, updated_at, metadata:value->metadata')
        .gte('key', '/projects/')
        .lt('key', '/projects0')
        .limit(2000);

    if (rawProjects && rawProjects.length > 0) {
        console.log('Sample raw project from current db.service.ts select:');
        console.log(JSON.stringify(rawProjects[0], null, 2));
    }

    // Test full value select
    const { data: fullProjects } = await supabase
        .from('kv_store')
        .select('key, value, updated_at')
        .gte('key', '/projects/')
        .lt('key', '/projects0')
        .limit(2000);

    if (fullProjects && fullProjects.length > 0) {
        console.log('\nSample full project select:');
        const item = fullProjects[0];
        let val = item.value;
        if (typeof val === 'string') val = JSON.parse(val);
        const parsed = { ...val, id: val.id || item.key.split('/').pop(), key: item.key, updated_at: item.updated_at };
        console.log('Keys in parsed full project:', Object.keys(parsed));
        console.log('Project email / contact:', parsed.metadata?.contact?.email || parsed.customerEmail || parsed.userEmail || parsed.email);
    }
}

testGetVal().catch(console.error);
