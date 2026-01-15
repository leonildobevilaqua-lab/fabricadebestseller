import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    console.log("Testing Supabase Connection...");

    try {
        // Try to select headers or just count to verify table exists
        const { count, error } = await supabase.from('projects').select('*', { count: 'exact', head: true });

        if (error) {
            console.error("FAILED connecting/reading 'projects':", error.message);
            if (error.code === '42P01') {
                console.error("Reason: Table 'projects' does NOT exist. Please run the SQL script.");
            }
        } else {
            console.log("SUCCESS! Connected to Supabase.");
            console.log(`Table 'projects' found. Current row count: ${count}`);

            // Try a test insert/delete to ensure RLS allows it
            const testId = '00000000-0000-0000-0000-000000000000';
            const { error: insertErr } = await supabase.from('projects').insert({ id: testId, topic: 'Integration Test' });

            if (insertErr) {
                console.error("Insert Failed (Check RLS policies):", insertErr.message);
            } else {
                console.log("Write permission confirmed.");
                // Clean up
                await supabase.from('projects').delete().eq('id', testId);
            }
        }

    } catch (e: any) {
        console.error("Unexpected error:", e.message);
    }
}

checkConnection();
