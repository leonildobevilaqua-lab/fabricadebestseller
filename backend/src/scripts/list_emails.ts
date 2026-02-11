
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listEmails() {
    console.log("Fetching emails...");
    // A tabela projects tem coluna 'email' baseada no schema que vi no passo 103: available columns includes 'email'
    const { data: projects, error } = await supabase
        .from('projects')
        .select('email, updated_at, status')
        .order('updated_at', { ascending: false })
        .limit(5);

    if (projects) {
        const lines = projects.map((p: any) => `${p.email} | ${p.status} | ${p.updated_at}`).join('\n');
        fs.writeFileSync(path.join(__dirname, '../../debug_emails.txt'), lines);
        console.log("Emails saved.");
    } else {
        console.log("No projects found or Error:", error);
    }
}

listEmails();
