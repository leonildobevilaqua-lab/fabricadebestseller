
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = 'sb_publishable_Ix_HjXtyDpf8GyaFEoQ9AA_QqfH_aBC';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Publishable Key access...");
    const { data, error } = await supabase.from('kv_store').select('key').limit(5);
    if (error) {
        console.error("❌ Access denied with Publishable Key:", error);
    } else {
        console.log("✅ Access successful with Publishable Key. Found:", data.length, "items.");
    }
}

test();
