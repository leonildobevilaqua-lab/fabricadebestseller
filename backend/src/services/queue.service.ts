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
        const data = await getVal(`/projects/${id}`, { forceSync: true });
        if (!data) return null;

        // Ensure Dates are Date objects (JSON stores as strings)
        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
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
            // Merger deep objects if necessary, but Partial<BookProject> usually replaces top-level keys
            // metadata is handled separately usually, but if passed here, we merge it
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

        // Filter by Email
        // Note: Project metadata might use 'contact.email' or just rely on authorName locally?
        // Check `createProject` usage -> metadata includes contact
        const userProjects = projectsList.filter(p => {
            if (!p) return false;
            const projMetadata = p.metadata || (p as any);
            const projEmail = (projMetadata.contact?.email || (p as any).contact?.email || (p as any).customerEmail || (p as any).userEmail || (p as any).email || '').toLowerCase().trim();
            return projEmail === email.toLowerCase().trim();
        });

        if (userProjects.length === 0) return null;

        // Sort by Created At Descending
        userProjects.sort((a: any, b: any) => {
            const da = new Date(a.createdAt || a.created_at || a.updatedAt || a.updated_at || 0).getTime();
            const db = new Date(b.createdAt || b.created_at || b.updatedAt || b.updated_at || 0).getTime();
            return db - da;
        });

        // Prioritize UNFINISHED projects for resuming
        const activeProject = userProjects.find((p: any) => {
            const status = p.metadata?.status || p.status;
            return status !== 'COMPLETED' &&
                status !== 'LIVRO ENTREGUE' &&
                status !== 'FAILED';
        });

        const selected = activeProject || userProjects[0];

        // Format dates
        return {
            ...selected,
            createdAt: new Date(selected.createdAt),
            updatedAt: new Date(selected.updatedAt)
        };

    } catch (error) {
        console.error("DB GetByEmail Error", error);
        return null;
    }
};
