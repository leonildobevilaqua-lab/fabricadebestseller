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
const supabase_1 = require("./services/supabase");
function debugProjects() {
    return __awaiter(this, void 0, void 0, function* () {
        const email = "contato@leonildobevilaqua.com.br";
        console.log(`Searching projects for: ${email}`);
        const { data: projects, error } = yield supabase_1.supabase
            .from('projects')
            .select('id, book_title, created_at, structure')
            .eq('email', email)
            .order('created_at', { ascending: false });
        if (error) {
            console.error("Supabase Error:", error);
            return;
        }
        console.log(`Found ${projects === null || projects === void 0 ? void 0 : projects.length} projects.`);
        projects === null || projects === void 0 ? void 0 : projects.forEach((p) => {
            const structureLen = Array.isArray(p.structure) ? p.structure.length : 0;
            console.log(`- [${p.created_at}] ID: ${p.id} | Title: ${p.book_title} | Chapters: ${structureLen}`);
            if (structureLen > 0) {
                console.log(`  First Chapter: ${p.structure[0].title}`);
            }
        });
    });
}
debugProjects();
