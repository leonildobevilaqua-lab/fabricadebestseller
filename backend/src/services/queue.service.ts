import { BookProject, BookMetadata, JobStatus } from "../types"; // Adjust path if needed, check tsconfig? No, it's relative.
import { getVal, setVal } from "./db.service";
import { v4 as uuidv4 } from "uuid";

// REPLACED SUPABASE WITH LOCAL JSON DB FOR VPS COMPATIBILITY

export const createProject = async (metadata: Partial<BookMetadata>): Promise<BookProject> => {
    const id = uuidv4();

    const newProject: BookProject = {
        id,
        metadata: {
            id,
            authorName: metadata.authorName || "",
            topic: metadata.topic || "",
            status: 'IDLE',
            progress: 0,
            currentStep: 'START',
            statusMessage: 'Aguardando início...',
            ...metadata
        },
        researchContext: "",
        titleOptions: [],
        structure: [],
        marketing: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        // Store in JSON DB as key-value pair for O(1) access
        await setVal(`/projects/${id}`, newProject);
        return newProject;
    } catch (error) {
        console.error("DB Create Error:", error);
        throw new Error("Failed to create project in DB");
    }
};

export const getProject = async (id: string): Promise<BookProject | null> => {
    try {
        const data = await getVal(`/projects/${id}`);
        if (!data) return null;

        const metadata: BookMetadata = {
            id: data.id || id,
            authorName: data.metadata?.authorName || data.authorName || '',
            topic: data.metadata?.topic || data.topic || '',
            status: data.metadata?.status || data.status || 'IDLE',
            progress: data.metadata?.progress ?? data.progress ?? 0,
            currentStep: data.metadata?.currentStep || data.currentStep || 'START',
            statusMessage: data.metadata?.statusMessage || data.statusMessage || '',
            bookTitle: data.metadata?.bookTitle || data.bookTitle || data.title || '',
            subTitle: data.metadata?.subTitle || data.subTitle || '',
            language: data.metadata?.language || data.language || 'pt',
            isFiction: data.metadata?.isFiction ?? data.isFiction ?? false,
            genre: data.metadata?.genre || data.genre || data.contentStyle || '',
            lastWorkerPulse: data.metadata?.lastWorkerPulse || data.lastWorkerPulse || data.updatedAt || '',
            currentWorkerId: data.metadata?.currentWorkerId || data.currentWorkerId || '',
            ...data.metadata
        };

        return {
            ...data,
            metadata,
            createdAt: new Date(data.createdAt || data.created_at || Date.now()),
            updatedAt: new Date(data.updatedAt || data.updated_at || Date.now())
        };
    } catch (error) {
        console.error("DB Get Error:", error);
        return null;
    }
};

export const updateProject = async (id: string, updates: Partial<BookProject>) => {
    try {
        const current = await getProject(id);
        if (!current) return;

        const updated = {
            ...current,
            ...updates,
            updatedAt: new Date(),
            metadata: updates.metadata ? { ...current.metadata, ...updates.metadata } : current.metadata
        };

        await setVal(`/projects/${id}`, updated);
    } catch (error) {
        console.error("DB Update Error", error);
    }
};

export const updateMetadata = async (id: string, metadataUpdates: Partial<BookMetadata>) => {
    try {
        const current = await getProject(id);
        if (!current) return;

        const updated = {
            ...current,
            metadata: {
                ...current.metadata,
                ...metadataUpdates
            },
            updatedAt: new Date()
        };

        await setVal(`/projects/${id}`, updated);
    } catch (error) {
        console.error("DB Metadata Update Error", error);
    }
};

export const getProjectByEmail = async (email: string): Promise<BookProject | null> => {
    try {
        const allProjects = await getVal('/projects');
        if (!allProjects) return null;

        const projectsList = Object.values(allProjects) as BookProject[];

        const userProjects = projectsList.filter(p => {
            if (!p) return false;
            const projMetadata = p.metadata || (p as any);
            const projEmail = (projMetadata.contact?.email || (p as any).contact?.email || (p as any).customerEmail || (p as any).userEmail || (p as any).email || '').toLowerCase().trim();
            return projEmail === email.toLowerCase().trim();
        });

        if (userProjects.length === 0) return null;

        userProjects.sort((a: any, b: any) => {
            const da = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime();
            const db = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime();
            return db - da;
        });

        const finishedStatuses = ['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'WAITING_DETAILS', 'DONE', 'FINISHED', 'APPROVED', 'READY_TO_DOWNLOAD', 'FAILED'];

        const activeProject = userProjects.find((p: any) => {
            const status = p.metadata?.status || p.status;
            return !finishedStatuses.includes(status as any);
        });

        const selected = activeProject || userProjects[0];
        const projId = selected.id || (selected as any).key?.split('/').pop();
        return getProject(projId);

    } catch (error) {
        console.error("DB GetByEmail Error", error);
        return null;
    }
};
