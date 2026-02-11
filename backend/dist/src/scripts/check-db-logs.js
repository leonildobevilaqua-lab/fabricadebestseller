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
function checkSchema() {
    return __awaiter(this, void 0, void 0, function* () {
        let output = "--- Discovery Schema ---\n";
        const { data: projects, error } = yield supabase
            .from('projects')
            .select('*')
            .limit(1);
        if (error) {
            output += `Supabase Error: ${JSON.stringify(error)}\n`;
        }
        else if (!projects || projects.length === 0) {
            output += "No projects found to inspect.\n";
        }
        else {
            const p = projects[0];
            output += `Available Columns: ${JSON.stringify(Object.keys(p))}\n`;
            output += "\n--- Recent Logs (based on updated_at) ---\n";
            const { data: recent } = yield supabase
                .from('projects')
                .select('id, metadata, updated_at')
                .order('updated_at', { ascending: false })
                .limit(15);
            if (recent) {
                recent.forEach((r) => {
                    let meta = {};
                    try {
                        meta = typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata;
                    }
                    catch (e) {
                        meta = {};
                    }
                    output += `[${new Date(r.updated_at).toLocaleString()}] ID: ${r.id.substring(0, 8)} | Status: ${meta === null || meta === void 0 ? void 0 : meta.status} | Msg: ${meta === null || meta === void 0 ? void 0 : meta.statusMessage}\n`;
                });
            }
        }
        fs_1.default.writeFileSync(path_1.default.join(__dirname, '../../debug_production_log.txt'), output);
        console.log("Log flushed to debug_production_log.txt");
    });
}
checkSchema();
