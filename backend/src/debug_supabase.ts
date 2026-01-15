
import { supabase } from './services/supabase';

async function debugProjects() {
    const email = "contato@leonildobevilaqua.com.br";
    console.log(`Searching projects for: ${email}`);

    const { data: projects, error } = await supabase
        .from('projects')
        .select('id, book_title, created_at, structure')
        .eq('email', email)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    console.log(`Found ${projects?.length} projects.`);
    projects?.forEach((p: any) => {
        const structureLen = Array.isArray(p.structure) ? p.structure.length : 0;
        console.log(`- [${p.created_at}] ID: ${p.id} | Title: ${p.book_title} | Chapters: ${structureLen}`);
        if (structureLen > 0) {
            console.log(`  First Chapter: ${p.structure[0].title}`);
        }
    });
}

debugProjects();
