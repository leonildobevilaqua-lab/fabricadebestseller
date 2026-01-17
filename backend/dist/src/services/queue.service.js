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
exports.getProjectByEmail = exports.updateMetadata = exports.updateProject = exports.getProject = exports.createProject = void 0;
const supabase_1 = require("./supabase");
const uuid_1 = require("uuid");
// We keep a local cache for speed, but sync with DB
// NOTE: For a real stateless backend, we would rely purely on DB, but for this agentic refactor,
// we will try to read from DB on getProject.
const createProject = (metadata) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (0, uuid_1.v4)();
    const newProject = {
        id,
        metadata: Object.assign({ id, authorName: metadata.authorName || "", topic: metadata.topic || "", status: 'IDLE', progress: 0, currentStep: 'START', statusMessage: 'Aguardando início...' }, metadata),
        researchContext: "",
        titleOptions: [],
        structure: [],
        marketing: null,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    // Convert to DB format snake_case
    const { error } = yield supabase_1.supabase.from('projects').insert({
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
        marketing: null,
        email: (_a = newProject.metadata.contact) === null || _a === void 0 ? void 0 : _a.email
    });
    if (error) {
        console.error("Supabase Create Error:", error);
        throw new Error("Failed to create project in DB");
    }
    return newProject;
});
exports.createProject = createProject;
const getProject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const { data, error } = yield supabase_1.supabase.from('projects').select('*').eq('id', id).single();
    if (error || !data)
        return null;
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
});
exports.getProject = getProject;
const updateProject = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    // We need to flatten the update for Supabase
    const dbUpdates = { updated_at: new Date() };
    if (updates.researchContext !== undefined)
        dbUpdates.research_context = updates.researchContext;
    if (updates.titleOptions !== undefined)
        dbUpdates.title_options = updates.titleOptions;
    if (updates.structure !== undefined)
        dbUpdates.structure = updates.structure;
    if (updates.marketing !== undefined)
        dbUpdates.marketing = updates.marketing;
    // If metadata is also updated deep inside
    if (updates.metadata) {
        if (updates.metadata.status)
            dbUpdates.status = updates.metadata.status;
        if (updates.metadata.progress)
            dbUpdates.progress = updates.metadata.progress;
        if (updates.metadata.statusMessage)
            dbUpdates.status_message = updates.metadata.statusMessage;
        if (updates.metadata.bookTitle)
            dbUpdates.book_title = updates.metadata.bookTitle;
        if (updates.metadata.subTitle)
            dbUpdates.sub_title = updates.metadata.subTitle;
    }
    const { error } = yield supabase_1.supabase.from('projects').update(dbUpdates).eq('id', id);
    if (error)
        console.error("Supabase Update Project Error:", error);
});
exports.updateProject = updateProject;
const updateMetadata = (id, metadataUpdates) => __awaiter(void 0, void 0, void 0, function* () {
    const dbUpdates = { updated_at: new Date() };
    if (metadataUpdates.status)
        dbUpdates.status = metadataUpdates.status;
    if (metadataUpdates.progress !== undefined)
        dbUpdates.progress = metadataUpdates.progress;
    if (metadataUpdates.statusMessage)
        dbUpdates.status_message = metadataUpdates.statusMessage;
    if (metadataUpdates.currentStep)
        dbUpdates.current_step = metadataUpdates.currentStep;
    if (metadataUpdates.bookTitle)
        dbUpdates.book_title = metadataUpdates.bookTitle;
    if (metadataUpdates.subTitle)
        dbUpdates.sub_title = metadataUpdates.subTitle;
    const { error } = yield supabase_1.supabase.from('projects').update(dbUpdates).eq('id', id);
    if (error)
        console.error("Supabase Update Metadata Error:", error);
    if (error)
        console.error("Supabase Update Metadata Error:", error);
});
exports.updateMetadata = updateMetadata;
const getProjectByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // Find the most recent project for this email that is NOT effectively "archived"
    // For now, simply return the latest one. Better logic might be to return the latest *unfinished* one
    // or if the latest is completed, maybe return null to allow creating a new one?
    // User Requirement: "Resume Generation".
    // If I have an unfinished project, I want that one.
    // If I have only completed projects, I probably want a new one.
    // Sort by created_at desc to get the latest
    const { data: projects, error } = yield supabase_1.supabase
        .from('projects')
        .select('*')
        .eq('email', email)
        .order('created_at', { ascending: false })
        .limit(5); // Fetch top 5 to check for valid content
    if (error || !projects || projects.length === 0) {
        console.log(`getProjectByEmail: No projects found for ${email} (Error: ${error === null || error === void 0 ? void 0 : error.message})`);
        return null;
    }
    console.log(`getProjectByEmail: Found ${projects.length} candidates for ${email}.`);
    projects.forEach((p, i) => {
        const sLen = p.structure ? (Array.isArray(p.structure) ? p.structure.length : 'Not Array') : 'undefined';
        console.log(`Example ${i}: ID ${p.id} | Title: ${p.book_title} | Structure Len: ${sLen}`);
    });
    // STRICT FIX: Always return the LATEST project (index 0). 
    // Do NOT try to be smart and find "non-empty" ones, because that causes "Wrong Book" bugs if the new project is empty/buggy.
    const data = projects[0];
    console.log(`getProjectByEmail: Selected ID ${data.id}`);
    if (error || !data)
        return null;
    // Check status. If it's completed, should we resume it? 
    // If we return a completed project, the UI shows "Finalized". 
    // If the user wants to start a NEW book, this logic prevents it UNLESS we check for "active" status.
    // However, if the user just refreshed the "Finalized" page, they expect to see it again.
    // Let's assume for now we return the latest. 
    // To allow "New Project", the frontend likely needs an explicit "Create New" action which bypasses this check,
    // but the current frontend logic calls "createProject" automatically on wizard start.
    // A refine strategy: Return project only if status != COMPLETED.
    // But if I refresh page on Completed screen, I want to see Completed screen.
    // Let's stick to returning the latest for now. User can "Reset" in UI.
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
            currentStep: data.current_step,
            language: 'pt', // Default or need column
            contact: { name: data.author_name, email: data.email || email, phone: "" } // Partial reconstruction
        },
        researchContext: data.research_context || "",
        titleOptions: data.title_options || [],
        structure: data.structure || [],
        marketing: data.marketing || null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
    };
});
exports.getProjectByEmail = getProjectByEmail;
