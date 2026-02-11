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
exports.translateBook = void 0;
const db_service_1 = require("../services/db.service");
// import { Project } from '../types'; // Assuming types are here or use any
const translateBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const { targetLang } = req.body; // 'en', 'es', 'pt'
    if (!['en', 'es', 'pt'].includes(targetLang)) {
        return res.status(400).json({ error: "Idioma inválido." });
    }
    try {
        const project = yield (0, db_service_1.getVal)(`/projects/${id}`);
        if (!project || !project.structure) {
            return res.status(404).json({ error: "Projeto não encontrado ou sem conteúdo gerado." });
        }
        // Check if already translating
        const translations = project.metadata.translations || {};
        const currentTrans = translations[targetLang];
        if ((currentTrans === null || currentTrans === void 0 ? void 0 : currentTrans.status) === 'IN_PROGRESS') {
            return res.json({ success: true, message: "Tradução em andamento.", status: 'IN_PROGRESS' });
        }
        if ((currentTrans === null || currentTrans === void 0 ? void 0 : currentTrans.status) === 'COMPLETED') {
            return res.json({ success: true, message: "Tradução já concluída.", status: 'COMPLETED' });
        }
        // Set status to IN_PROGRESS
        const newTranslations = Object.assign(Object.assign({}, translations), { [targetLang]: { status: 'IN_PROGRESS', progress: 0 } });
        yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, newTranslations);
        res.json({ success: true, message: "Tradução iniciada." });
        // --- BACKGROUND TRANSLATION SIMULATION (Replace with Real AI later) ---
        (() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                // Simulate processing time per chapter
                const totalChapters = project.structure.length;
                const translatedStructure = [];
                for (let i = 0; i < totalChapters; i++) {
                    const chapter = project.structure[i];
                    // Simulate AI Translation Delay
                    yield new Promise(r => setTimeout(r, 2000));
                    // Mock Translation Logic
                    let suffix = targetLang === 'en' ? ' (English)' : targetLang === 'es' ? ' (Español)' : ' (Português)';
                    translatedStructure.push(Object.assign(Object.assign({}, chapter), { title: chapter.title + suffix, content: `[Translated Content to ${targetLang}]\n\n` + chapter.content }));
                    // Update Progress
                    const p = Math.round(((i + 1) / totalChapters) * 100);
                    yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations/${targetLang}/progress`, p);
                }
                // MARK COMPLETED
                const finalTranslations = (yield (0, db_service_1.getVal)(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = {
                    status: 'COMPLETED',
                    structure: translatedStructure
                };
                yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, finalTranslations);
                console.log(`Translation to ${targetLang} completed for project ${id}`);
            }
            catch (err) {
                console.error("Translation Error:", err);
                const finalTranslations = (yield (0, db_service_1.getVal)(`/projects/${id}/metadata/translations`)) || {};
                finalTranslations[targetLang] = { status: 'FAILED' };
                yield (0, db_service_1.setVal)(`/projects/${id}/metadata/translations`, finalTranslations);
            }
        }))();
    }
    catch (e) {
        console.error(e);
        // Avoid sending response again if already sent
    }
});
exports.translateBook = translateBook;
