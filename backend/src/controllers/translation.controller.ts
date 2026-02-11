import { Request, Response } from 'express';
import { getVal, setVal } from '../services/db.service';
// import { Project } from '../types'; // Assuming types are here or use any

export const translateBook = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetLang } = req.body; // 'en', 'es', 'pt'

    if (!['en', 'es', 'pt'].includes(targetLang)) {
        return res.status(400).json({ error: "Idioma inválido." });
    }

    try {
        const project: any = await getVal(`/projects/${id}`);
        if (!project || !project.structure) {
            return res.status(404).json({ error: "Projeto não encontrado ou sem conteúdo gerado." });
        }

        // Check if already translating
        const translations = project.metadata.translations || {};
        const currentTrans = translations[targetLang];

        if (currentTrans?.status === 'IN_PROGRESS') {
            return res.json({ success: true, message: "Tradução em andamento.", status: 'IN_PROGRESS' });
        }
        if (currentTrans?.status === 'COMPLETED') {
            return res.json({ success: true, message: "Tradução já concluída.", status: 'COMPLETED' });
        }

        // Set status to IN_PROGRESS
        const newTranslations = {
            ...translations,
            [targetLang]: { status: 'IN_PROGRESS', progress: 0 }
        };
        await setVal(`/projects/${id}/metadata/translations`, newTranslations);

        res.json({ success: true, message: "Tradução iniciada." });

        // --- BACKGROUND TRANSLATION SIMULATION (Replace with Real AI later) ---
        (async () => {
            try {
                // Simulate processing time per chapter
                const totalChapters = project.structure.length;
                const translatedStructure = [];

                for (let i = 0; i < totalChapters; i++) {
                    const chapter = project.structure[i];

                    // Simulate AI Translation Delay
                    await new Promise(r => setTimeout(r, 2000));

                    // Mock Translation Logic
                    let suffix = targetLang === 'en' ? ' (English)' : targetLang === 'es' ? ' (Español)' : ' (Português)';
                    translatedStructure.push({
                        ...chapter,
                        title: chapter.title + suffix,
                        content: `[Translated Content to ${targetLang}]\n\n` + chapter.content
                    });

                    // Update Progress
                    const p = Math.round(((i + 1) / totalChapters) * 100);
                    await setVal(`/projects/${id}/metadata/translations/${targetLang}/progress`, p);
                }

                // MARK COMPLETED
                const finalTranslations = (await getVal(`/projects/${id}/metadata/translations`)) as any || {};
                finalTranslations[targetLang] = {
                    status: 'COMPLETED',
                    structure: translatedStructure
                };

                await setVal(`/projects/${id}/metadata/translations`, finalTranslations);

                console.log(`Translation to ${targetLang} completed for project ${id}`);

            } catch (err) {
                console.error("Translation Error:", err);
                const finalTranslations = (await getVal(`/projects/${id}/metadata/translations`)) as any || {};
                finalTranslations[targetLang] = { status: 'FAILED' };
                await setVal(`/projects/${id}/metadata/translations`, finalTranslations);
            }
        })();

    } catch (e: any) {
        console.error(e);
        // Avoid sending response again if already sent
    }
};
