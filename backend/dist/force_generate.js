"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const QueueService = __importStar(require("./src/services/queue.service"));
const DocService = __importStar(require("./src/services/doc.service"));
const supabase_1 = require("./src/services/supabase");
function forceGenerate() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // 1. Specific Project ID identifying "Crianças e Adolescentes Sem Limites"
        const targetId = '72886aec-2792-439e-8b6b-efc31d573361';
        console.log(`Force generating DOCX for Project ID: ${targetId}`);
        // 2. Fetch Project
        const project = yield QueueService.getProject(targetId);
        if (!project) {
            console.error("Project not found in DB!");
            return;
        }
        console.log(`Project Found: ${project.metadata.bookTitle}`);
        console.log(`Structure Length: ${((_a = project.structure) === null || _a === void 0 ? void 0 : _a.length) || 0}`);
        console.log(`Metadata ID: ${project.metadata.id}`);
        if (!project.structure || project.structure.length === 0) {
            console.error("CRITICAL: Project has no structure!");
            // Fetch raw to verify
            const { data } = yield supabase_1.supabase.from('projects').select('structure').eq('id', targetId).single();
            console.log("Raw Supabase Structure:", JSON.stringify(data));
            return;
        }
        // 3. Generate DOCX
        console.log("Starting DOCX generation...");
        try {
            const filePath = yield DocService.generateBookDocx(project);
            console.log("-----------------------------------------");
            console.log("SUCCESS! Book generated at:");
            console.log(filePath);
            console.log("-----------------------------------------");
        }
        catch (e) {
            console.error("Error generating DOCX:", e);
        }
    });
}
forceGenerate();
