
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const key = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';

const supabase = createClient(url, key);

async function test() {
    console.log("Testing Supabase connectivity...");
    const { data, error } = await supabase.from('kv_store').upsert({ key: '/test_script', value: { date: new Date() } });
    if (error) console.error("Error:", error);
    else console.log("Success!");
}

test();
