import { BookProject, BookMetadata, JobStatus } from "../types";
import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// We keep a local cache for speed, but sync with DB
// NOTE: For a real stateless backend, we would rely purely on DB, but for this agentic refactor,
// we will try to read from DB on getProject.

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

    // Convert to DB format snake_case
    const { error } = await supabase.from('projects').insert({
        id: newProject.id,
        author_name: newProject.metadata.authorName,
        topic: newProject.metadata.topic,
        status: newProject.metadata.status,
        progress: newProject.metadata.progress,
        status_message: newProject.metadata.statusMessage,
        current_step: newProject.metadata.currentStep,
        research_context: "",
        title_options: [],
        structure: [],
        marketing: null
    });

    if (error) {
        console.error("Supabase Create Error:", error);
        throw new Error("Failed to create project in DB");
    }

    return newProject;
};

export const getProject = async (id: string): Promise<BookProject | null> => {
    const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

    if (error || !data) return null;

    // Map back to our Type
    return {
        id: data.id,
        metadata: {
            id: data.id,
            authorName: data.author_name,
            topic: data.topic,
            bookTitle: data.book_title,
            subTitle: data.sub_title,
            dedication: data.dedication,
            status: data.status,
            progress: data.progress,
            statusMessage: data.status_message,
            currentStep: data.current_step
        },
        researchContext: data.research_context || "",
        titleOptions: data.title_options || [],
        structure: data.structure || [],
        marketing: data.marketing || null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
    };
};

export const updateProject = async (id: string, updates: Partial<BookProject>) => {
    // We need to flatten the update for Supabase
    const dbUpdates: any = { updated_at: new Date() };

    if (updates.researchContext !== undefined) dbUpdates.research_context = updates.researchContext;
    if (updates.titleOptions !== undefined) dbUpdates.title_options = updates.titleOptions;
    if (updates.structure !== undefined) dbUpdates.structure = updates.structure;
    if (updates.marketing !== undefined) dbUpdates.marketing = updates.marketing;

    // If metadata is also updated deep inside
    if (updates.metadata) {
        if (updates.metadata.status) dbUpdates.status = updates.metadata.status;
        if (updates.metadata.progress) dbUpdates.progress = updates.metadata.progress;
        if (updates.metadata.statusMessage) dbUpdates.status_message = updates.metadata.statusMessage;
        if (updates.metadata.bookTitle) dbUpdates.book_title = updates.metadata.bookTitle;
        if (updates.metadata.subTitle) dbUpdates.sub_title = updates.metadata.subTitle;
    }

    const { error } = await supabase.from('projects').update(dbUpdates).eq('id', id);
    if (error) console.error("Supabase Update Project Error:", error);
};

export const updateMetadata = async (id: string, metadataUpdates: Partial<BookMetadata>) => {
    const dbUpdates: any = { updated_at: new Date() };

    if (metadataUpdates.status) dbUpdates.status = metadataUpdates.status;
    if (metadataUpdates.progress !== undefined) dbUpdates.progress = metadataUpdates.progress;
    if (metadataUpdates.statusMessage) dbUpdates.status_message = metadataUpdates.statusMessage;
    if (metadataUpdates.currentStep) dbUpdates.current_step = metadataUpdates.currentStep;
    if (metadataUpdates.bookTitle) dbUpdates.book_title = metadataUpdates.bookTitle;
    if (metadataUpdates.subTitle) dbUpdates.sub_title = metadataUpdates.subTitle;

    const { error } = await supabase.from('projects').update(dbUpdates).eq('id', id);
    if (error) console.error("Supabase Update Metadata Error:", error);
};
