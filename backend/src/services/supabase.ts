import { createClient } from '@supabase/supabase-js';

// Estas chaves deveriam estar no .env, mas para o protótipo vou iniciar com elas aqui ou ler do env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL ERROR: Supabase environment variables are missing!");
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
