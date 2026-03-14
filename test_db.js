
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const cleanPath = '/projects';
    const { data, error } = await supabase
        .from('kv_store')
        .select('*')
        .like('key', `${cleanPath}/%`);

    console.log("Error:", error);
    console.log("Data length:", data ? data.length : 0);
    
    if (data) {
        const prefixSegments = cleanPath.split('/').filter(Boolean).length;
        const rootEntries = data.filter(item => {
            const segments = item.key.split('/').filter(Boolean);
            return segments.length === prefixSegments + 1;
        });
        console.log("Root entries length:", rootEntries.length);
        
        const cleanUser = "contato@leonildobevilaqua.com.br";
        const userProjects = rootEntries.filter(item => {
            const p = item.value;
            return p.metadata?.contact?.email?.toLowerCase().trim() === cleanUser;
        });
        
        console.log("User projects for Leonildo:", userProjects.length);
        if (userProjects.length > 0) {
            console.log("Order sample title:", userProjects[0].value.metadata?.bookTitle);
        }
    }
}

test();
