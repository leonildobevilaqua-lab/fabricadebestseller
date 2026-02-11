
import * as QueueService from './src/services/queue.service';
import * as DocService from './src/services/doc.service';
import { supabase } from './src/services/supabase';

async function forceGenerate() {
    // 1. Specific Project ID identifying "Crianças e Adolescentes Sem Limites"
    const targetId = '72886aec-2792-439e-8b6b-efc31d573361';

    console.log(`Force generating DOCX for Project ID: ${targetId}`);

    // 2. Fetch Project
    const project = await QueueService.getProject(targetId);

    if (!project) {
        console.error("Project not found in DB!");
        return;
    }

    console.log(`Project Found: ${project.metadata.bookTitle}`);
    console.log(`Structure Length: ${project.structure?.length || 0}`);
    console.log(`Metadata ID: ${project.metadata.id}`);

    if (!project.structure || project.structure.length === 0) {
        console.error("CRITICAL: Project has no structure!");
        // Fetch raw to verify
        const { data } = await supabase.from('projects').select('structure').eq('id', targetId).single();
        console.log("Raw Supabase Structure:", JSON.stringify(data));
        return;
    }

    // 3. Generate DOCX
    console.log("Starting DOCX generation...");
    try {
        const filePath = await DocService.generateBookDocx(project);
        console.log("-----------------------------------------");
        console.log("SUCCESS! Book generated at:");
        console.log(filePath);
        console.log("-----------------------------------------");
    } catch (e) {
        console.error("Error generating DOCX:", e);
    }
}

forceGenerate();
