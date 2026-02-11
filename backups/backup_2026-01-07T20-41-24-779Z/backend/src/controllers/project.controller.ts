import { Request, Response } from 'express';
import * as QueueService from '../services/queue.service';
import * as AIService from '../services/ai.service';
import { TitleOption } from '../types';
import { sendEmail } from '../services/email.service';
import multer from 'multer';

const upload = multer();

export const create = async (req: Request, res: Response) => {
    const { authorName, topic, language, contact } = req.body;
    try {
        const project = await QueueService.createProject({ authorName, topic, language, contact });
        res.json(project);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
};

export const get = async (req: Request, res: Response) => {
    const project = await QueueService.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
};

export const startResearch = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { language } = req.body;
    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    // Update status and ensure language is in metadata (even if in-memory)
    await QueueService.updateMetadata(id, {
        status: 'RESEARCHING',
        progress: 5,
        statusMessage: "Iniciando agente de pesquisa...",
        language: language || project.metadata.language || 'pt'
    });

    res.json({ message: "Research started" });

    // Background Process with Granular Updates
    try {
        const topic = project.metadata.topic;
        const targetLang = language || project.metadata.language || 'pt';

        // Step 1: YouTube
        await QueueService.updateMetadata(id, {
            progress: 10,
            statusMessage: `Pesquisando no YouTube sobre "${topic}" (${targetLang})...`
        });
        const ytResearch = await AIService.researchYoutube(topic, targetLang);

        // Step 2: Google
        await QueueService.updateMetadata(id, {
            progress: 15,
            statusMessage: `Pesquisando no Google...`
        });
        const googleResearch = await AIService.researchGoogle(topic, ytResearch, targetLang);

        // Step 3: Competitors
        await QueueService.updateMetadata(id, {
            progress: 20,
            statusMessage: `Analisando Best-Sellers...`
        });
        const compResearch = await AIService.analyzeCompetitors(topic, ytResearch + "\n" + googleResearch, targetLang);

        const fullContext = `### PESQUISA YOUTUBE: \n${ytResearch} \n\n### PESQUISA GOOGLE: \n${googleResearch} \n\n### ANÁLISE DE LIVROS: \n${compResearch} `;
        await QueueService.updateProject(id, { researchContext: fullContext });

        // Auto-proceed to Titles
        await QueueService.updateMetadata(id, {
            progress: 25,
            statusMessage: "Gerando títulos virais..."
        });

        const titles = await AIService.generateTitleOptions(topic, fullContext, targetLang);
        await QueueService.updateProject(id, { titleOptions: titles });

        await QueueService.updateMetadata(id, {
            status: 'WAITING_TITLE',
            progress: 30,
            statusMessage: "Pesquisa Concluída! Selecione um título."
        });

    } catch (error: any) {
        console.error("Research Error:", error);
        const errorMessage = error?.message || "Erro desconhecido";
        await QueueService.updateMetadata(id, {
            status: 'FAILED',
            statusMessage: `Erro na Pesquisa: ${errorMessage} `
        });
    }
};

export const selectTitle = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, subtitle } = req.body;

    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    await QueueService.updateMetadata(id, {
        bookTitle: title, subTitle: subtitle,
        status: 'GENERATING_STRUCTURE',
        progress: 35,
        statusMessage: "Estruturando o livro com base em best-sellers..."
    });
    res.json({ message: "Title selected, generating structure..." });

    try {
        const lang = project.metadata.language || 'pt'; // Fallback
        const structure = await AIService.generateStructure(title, subtitle, project.researchContext, lang);
        await QueueService.updateProject(id, { structure });
        await QueueService.updateMetadata(id, {
            status: 'REVIEW_STRUCTURE', // New status for manual approval
            progress: 40,
            currentStep: 'REVIEW_STRUCTURE', // TS needs this to be valid
            statusMessage: "Estrutura pronta para aprovação."
        });
    } catch (error) {
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro ao gerar estrutura." });
    }
};

export const generateBookContent = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { language } = req.body;
    const project = await QueueService.getProject(id);
    if (!project) return res.status(404).json({ error: "Not found" });

    const targetLang = language || project.metadata.language || 'pt';

    await QueueService.updateMetadata(id, { status: 'WRITING_CHAPTERS', progress: 41 });
    res.json({ message: "Content generation started" });

    try {
        const chapters = [...project.structure];
        const total = chapters.length;

        // 1. Write Chapters
        for (let i = 0; i < total; i++) {
            const chapter = chapters[i];

            // RESUME LOGIC: Skip if already generated and has content
            if (chapter.isGenerated && chapter.content && chapter.content.length > 100) {
                console.log(`Skipping Chapter ${chapter.id} (Already generated)`);
                continue;
            }

            await QueueService.updateMetadata(id, {
                statusMessage: `Escrevendo Capítulo ${chapter.id}: ${chapter.title}...`,
                progress: 41 + Math.floor(((i) / total) * 40) // 41% to 81%
            });

            // Wait a bit to avoid rate limits if loop is tight? No, awaiting generation is enough.

            try {
                // Pass language to writer
                const meta = { ...project.metadata, language: targetLang };
                const content = await AIService.writeChapter(meta, chapter, project.structure, project.researchContext);
                chapter.content = content;
                chapter.isGenerated = true;
                await QueueService.updateProject(id, { structure: chapters });
            } catch (e: any) {
                console.error(`Error writing chapter ${chapter.id}:`, e);
                // If error, we stop here and mark as failed. The user can retry.
                // But to make it robust, we should probably mark status as FAILED so frontend shows Retry button.
                // However, we want to allow "Resume".
                throw e;
            }
        }

        // 2. Write Introduction (after chapters to be coherent)
        await QueueService.updateMetadata(id, {
            status: 'WRITING_CHAPTERS',
            progress: 85,
            statusMessage: "Escrevendo a Introdução de alto impacto..."
        });
        const introContent = await AIService.writeIntroduction(project.metadata, project.structure, project.researchContext, targetLang);
        // Store intro somewhere? Maybe as chapter 0 or specific field. For now, let's prepend to chapter list as Chapter 0 if not exists, or special field.
        // The user requested "Introduction" separately. Let's add it to project structure as a special item or just assume it is Chapter 0.
        // Let's create a "Intro" chapter.
        const introChapter: any = { id: 0, title: "Introdução", content: introContent, isGenerated: true };
        // Prepend to structure if not present
        if (project.structure[0].id !== 0) {
            project.structure.unshift(introChapter);
        } else {
            project.structure[0] = introChapter;
        }
        await QueueService.updateProject(id, { structure: project.structure });

        // 3. Marketing
        await QueueService.updateMetadata(id, {
            status: 'GENERATING_MARKETING' as any,
            progress: 90,
            statusMessage: "Criando sinopse, contracapa, orelhas e copy para YouTube..."
        });

        // Pass full book content context implicitly via research context or just metadata.
        // Ideally we pass a summary of what was written, but researchContext + structure is often enough for marketing.
        const marketing = await AIService.generateMarketing(project.metadata, project.researchContext, "", targetLang);
        await QueueService.updateProject(id, { marketing });

        // 4. Completed / Waiting Details
        await QueueService.updateMetadata(id, {
            status: 'WAITING_DETAILS',
            progress: 95,
            statusMessage: "Livro escrito! Aguardando dedicatória e diagramação..."
        });

    } catch (error) {
        console.error(error);
        await QueueService.updateMetadata(id, { status: 'FAILED', statusMessage: "Erro na geração do conteúdo." });
    }
};

export const sendBookEmail = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: "File required" });
    if (!email) return res.status(400).json({ error: "Email required" });

    try {
        console.log(`Sending email to ${email} for project ${id}`);
        await sendEmail(
            email,
            "Seu Livro Está Pronto! - Editora 360 Express",
            "Parabéns! Seu livro foi gerado com sucesso. Segue em anexo o arquivo DOCX formatado.",
            [{ filename: file.originalname || 'livro.docx', content: file.buffer }]
        );
        res.json({ success: true });
    } catch (error: any) {
        console.error("Email Error:", error);
        res.status(500).json({ error: error.message });
    }
};
