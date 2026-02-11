import { createClient } from '@supabase/supabase-js';

// Estas chaves deveriam estar no .env, mas para o protótipo vou iniciar com elas aqui ou ler do env
const supabaseUrl = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

export const supabase = createClient(supabaseUrl, supabaseKey);
