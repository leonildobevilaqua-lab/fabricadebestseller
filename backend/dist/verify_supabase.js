"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function checkConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Testing Supabase Connection...");
        try {
            // Try to select headers or just count to verify table exists
            const { count, error } = yield supabase.from('projects').select('*', { count: 'exact', head: true });
            if (error) {
                console.error("FAILED connecting/reading 'projects':", error.message);
                if (error.code === '42P01') {
                    console.error("Reason: Table 'projects' does NOT exist. Please run the SQL script.");
                }
            }
            else {
                console.log("SUCCESS! Connected to Supabase.");
                console.log(`Table 'projects' found. Current row count: ${count}`);
                // Try a test insert/delete to ensure RLS allows it
                const testId = '00000000-0000-0000-0000-000000000000';
                const { error: insertErr } = yield supabase.from('projects').insert({ id: testId, topic: 'Integration Test' });
                if (insertErr) {
                    console.error("Insert Failed (Check RLS policies):", insertErr.message);
                }
                else {
                    console.log("Write permission confirmed.");
                    // Clean up
                    yield supabase.from('projects').delete().eq('id', testId);
                }
            }
        }
        catch (e) {
            console.error("Unexpected error:", e.message);
        }
    });
}
checkConnection();
