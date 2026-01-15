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
const supabase_1 = require("./src/services/supabase");
function checkProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Checking projects for contato@leonildobevilaqua.com.br...");
        const { data: projects, error } = yield supabase_1.supabase
            .from('projects')
            .select('*')
            .ilike('email', 'contato@leonildobevilaqua.com.br') // Case insensitive just in case
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Error:", error);
            return;
        }
        if (!projects || projects.length === 0) {
            console.log("No projects found.");
            return;
        }
        console.log(`Found ${projects.length} projects.`);
        for (const p of projects) {
            let structureLen = 0;
            let totalContentLen = 0;
            if (p.structure && Array.isArray(p.structure)) {
                structureLen = p.structure.length;
                p.structure.forEach((c) => {
                    if (c.content)
                        totalContentLen += c.content.length;
                });
            }
            console.log(`
--------------------------------------------------
ID: ${p.id}
Created: ${p.created_at}
Title: ${p.book_title || 'N/A'}
Topic: ${p.topic ? p.topic.substring(0, 30) + '...' : 'N/A'}
Status: ${p.status}
Status Msg: ${p.status_message}
Structure Chapters: ${structureLen}
Total Content Length: ${totalContentLen} chars
Has Marketing? ${!!p.marketing}
--------------------------------------------------
        `);
        }
    });
}
checkProjects();
