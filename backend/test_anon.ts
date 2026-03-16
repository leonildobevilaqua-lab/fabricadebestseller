
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Anon Key access...");
    const { data, error } = await supabase.from('kv_store').select('key').limit(5);
    if (error) {
        console.error("❌ Access denied with Anon Key:", error);
    } else {
        console.log("✅ Access successful with Anon Key. Found:", data.length, "items.");
    }
}

test();
