import { supabase } from './src/services/supabase';

async function testQuery() {
    const strUser = 'leo';
    const { data, error } = await supabase
        .from('kv_store')
        .select('key, updated_at, metadata:value->metadata')
        .like('key', '/projects/%')
        .or(`value->metadata->>email.ilike.%${strUser}%,value->metadata->contact->>email.ilike.%${strUser}%`)
        .limit(5);

    if (error) {
        console.error("ERROR:", error.message, error.details, error.hint);
    } else {
        console.log("SUCCESS. Found:", data?.length);
    }
}
testQuery();
