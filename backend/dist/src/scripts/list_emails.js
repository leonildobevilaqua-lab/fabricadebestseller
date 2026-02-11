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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const supabase_js_1 = require("@supabase/supabase-js");
const fs_1 = __importDefault(require("fs"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const supabaseUrl = process.env.SUPABASE_URL || 'https://aulcxbqbiqlagocpjfvx.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1bGN4YnFiaXFsYWdvY3BqZnZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDE4ODAsImV4cCI6MjA4MzMxNzg4MH0.ooJbWU70OZBMkatrvx-XkkNq9JPZ878UCow7cXeJzAs';
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
function listEmails() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Fetching emails...");
        // A tabela projects tem coluna 'email' baseada no schema que vi no passo 103: available columns includes 'email'
        const { data: projects, error } = yield supabase
            .from('projects')
            .select('email, updated_at, status')
            .order('updated_at', { ascending: false })
            .limit(5);
        if (projects) {
            const lines = projects.map((p) => `${p.email} | ${p.status} | ${p.updated_at}`).join('\n');
            fs_1.default.writeFileSync(path_1.default.join(__dirname, '../../debug_emails.txt'), lines);
            console.log("Emails saved.");
        }
        else {
            console.log("No projects found or Error:", error);
        }
    });
}
listEmails();
