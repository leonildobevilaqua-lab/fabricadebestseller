
import { supabase } from './src/services/supabase';

async function checkProjects() {
    console.log("Checking projects for contato@leonildobevilaqua.com.br...");

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('email', 'contato@leonildobevilaqua.com.br') // Case insensitive just in case
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (!projects || projects.length === 0) {
        console.log("No projects found.");
        return;
    }

    console.log(`Found ${projects.length} projects.`);

    for (const p of projects) {
        let structureLen = 0;
        let totalContentLen = 0;

        if (p.structure && Array.isArray(p.structure)) {
            structureLen = p.structure.length;
            p.structure.forEach((c: any) => {
                if (c.content) totalContentLen += c.content.length;
            });
        }

        console.log(`
--------------------------------------------------
ID: ${p.id}
Created: ${p.created_at}
Title: ${p.book_title || 'N/A'}
Topic: ${p.topic ? p.topic.substring(0, 30) + '...' : 'N/A'}
Status: ${p.status}
Status Msg: ${p.status_message}
Structure Chapters: ${structureLen}
Total Content Length: ${totalContentLen} chars
Has Marketing? ${!!p.marketing}
--------------------------------------------------
        `);
    }
}

checkProjects();
