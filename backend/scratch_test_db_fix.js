const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testFixedGetVal(normalized) {
    const isCollectionRoot = ['/projects', '/leads', '/users', '/credits', '/orders'].includes(normalized);
    let results = [];

    // 1. Check if root key exists (e.g. key = "/leads")
    const { data: rootRow } = await supabase.from('kv_store').select('key, value, updated_at').eq('key', normalized).maybeSingle();
    if (rootRow && rootRow.value) {
        let val = rootRow.value;
        if (typeof val === 'string') { try { val = JSON.parse(val); } catch(e){} }
        if (Array.isArray(val)) {
            results.push(...val);
        } else if (typeof val === 'object' && val !== null) {
            results.push(...Object.values(val));
        }
    }

    // 2. Check individual sub-keys (e.g. key >= "/projects/" && key < "/projects0")
    let selectFields = 'key, updated_at, value';
    if (normalized === '/projects') {
        // Fast payload: select metadata, id, createdAt, updatedAt from JSON value
        selectFields = 'key, updated_at, value->metadata, value->id, value->createdAt, value->customerEmail';
    }

    const { data: rawItems } = await supabase
        .from('kv_store')
        .select(selectFields)
        .gte('key', `${normalized}/`)
        .lt('key', `${normalized}0`)
        .limit(2000);

    if (rawItems && rawItems.length > 0) {
        for (const item of rawItems) {
            let val = item.value;
            let metadata = item.metadata || (val && val.metadata) || val;
            
            if (typeof val === 'string') { try { val = JSON.parse(val); } catch(e){} }
            if (typeof metadata === 'string') { try { metadata = JSON.parse(metadata); } catch(e){} }

            if (metadata || val) {
                const projId = item.id || (val && val.id) || (metadata && metadata.id) || item.key.split('/').pop();
                const parsed = {
                    ...(val && typeof val === 'object' ? val : {}),
                    id: projId,
                    key: item.key,
                    updated_at: item.updated_at || (val && val.updatedAt),
                    metadata: metadata || {}
                };
                results.push(parsed);
            }
        }
    }

    return results;
}

async function runTest() {
    console.log('--- TESTING LEADS FETCH ---');
    const leads = await testFixedGetVal('/leads');
    console.log('Total Leads found:', leads.length);
    if (leads.length > 0) {
        console.log('Sample lead 0:', leads[0].name, leads[0].email, leads[0].status);
    }

    console.log('\n--- TESTING PROJECTS FETCH ---');
    const projects = await testFixedGetVal('/projects');
    console.log('Total Projects found:', projects.length);
    if (projects.length > 0) {
        console.log('Sample project 0:');
        console.log('  ID:', projects[0].id);
        console.log('  Title:', projects[0].metadata?.bookTitle || projects[0].metadata?.title);
        console.log('  Email:', projects[0].metadata?.contact?.email);
        console.log('  Status:', projects[0].metadata?.status);
    }
}

runTest().catch(console.error);
