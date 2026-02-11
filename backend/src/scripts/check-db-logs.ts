
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    let output = "--- Discovery Schema ---\n";

    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

    if (error) {
        output += `Supabase Error: ${JSON.stringify(error)}\n`;
    } else if (!projects || projects.length === 0) {
        output += "No projects found to inspect.\n";
    } else {
        const p = projects[0];
        output += `Available Columns: ${JSON.stringify(Object.keys(p))}\n`;

        output += "\n--- Recent Logs (based on updated_at) ---\n";
        const { data: recent } = await supabase
            .from('projects')
            .select('id, metadata, updated_at')
            .order('updated_at', { ascending: false })
            .limit(15);

        if (recent) {
            recent.forEach((r: any) => {
                let meta: any = {};
                try {
                    meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
                } catch (e) { meta = {}; }

                output += `[${new Date(r.updated_at).toLocaleString()}] ID: ${r.id.substring(0, 8)} | Status: ${meta?.status} | Msg: ${meta?.statusMessage}\n`;
            });
        }
    }

    fs.writeFileSync(path.join(__dirname, '../../debug_production_log.txt'), output);
    console.log("Log flushed to debug_production_log.txt");
}

checkSchema();
