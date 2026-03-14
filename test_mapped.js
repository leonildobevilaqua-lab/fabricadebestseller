
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';
const supabase = createClient(supabaseUrl, supabaseKey);

const getVal = async (pathStr) => {
    const cleanPath = pathStr.endsWith('/') && pathStr.length > 1 ? pathStr.slice(0, -1) : pathStr;
    const { data, error } = await supabase
        .from('kv_store')
        .select('*')
        .like('key', `${cleanPath}/%`);

    if (error || !data) return [];

    const prefixSegments = cleanPath.split('/').filter(Boolean).length;
    return data.filter(item => {
        const segments = item.key.split('/').filter(Boolean);
        return segments.length === prefixSegments + 1;
    }).map(item => item.value);
};

async function test() {
    const cleanUser = "contato@leonildobevilaqua.com.br";
    const userProjectsRaw = await getVal('/projects');
    const userProjects = userProjectsRaw.filter(p => {
        const projectEmail = p.metadata?.contact?.email || p.contact?.email || '';
        return projectEmail.toLowerCase().trim() === cleanUser;
    });

    console.log("Found projects:", userProjects.length);
    const mappedOrders = userProjects.map((p) => {
        const metadata = p.metadata || {};
        return {
            id: p.id || metadata.id,
            title: metadata.bookTitle || metadata.title || metadata.topic || p.title || 'Livro Gerado',
            authorName: metadata.authorName || metadata.contact?.name || p.authorName || '',
            date: p.createdAt || metadata.createdAt || new Date(),
            status: metadata.status || p.status || 'PROCESSING',
            downloadUrl: metadata.kitUrl || metadata.docLink || metadata.finalDocxUrl || `/api/projects/${p.id || metadata.id}/download`
        };
    });
    console.log("Mapped Orders:", JSON.stringify(mappedOrders, null, 2));
}

test();
