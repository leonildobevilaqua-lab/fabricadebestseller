
import { supabase } from '../services/supabase';

async function unblock() {
    console.log("Searching for stuck projects...");
    
    const { data: projects, error } = await supabase
        .from('kv_store')
        .select('*')
        .like('key', '/projects/%');

    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }

    const now = new Date();
    let unblockedCount = 0;

    for (const item of projects) {
        const project = item.value;
        const updatedAt = new Date(item.updated_at);
        const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

        // If status is not COMPLETED or FAILED, and it hasn't been updated for > 2 hours
        if (project.metadata && 
            project.metadata.status !== 'COMPLETED' && 
            project.metadata.status !== 'FAILED' && 
            diffHours > 2) {
            
            console.log(`Unblocking project ${item.key} (Stuck for ${diffHours.toFixed(1)} hours in ${project.metadata.status})`);
            
            // Reset to IDLE so the user can click Start again
            project.metadata.status = 'IDLE';
            project.metadata.progress = 0;
            project.metadata.statusMessage = 'Sistema reiniciado após travamento. Por favor, inicie a geração novamente.';
            
            await supabase
                .from('kv_store')
                .upsert({
                    key: item.key,
                    value: project,
                    updated_at: new Date().toISOString()
                });
            
            unblockedCount++;
        }
    }

    console.log(`Done. Unblocked ${unblockedCount} projects.`);
}

unblock();
