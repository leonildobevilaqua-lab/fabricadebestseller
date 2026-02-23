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
const db_service_1 = require("./db.service");
const uuid_1 = require("uuid");
// REPLACED SUPABASE WITH LOCAL JSON DB FOR VPS COMPATIBILITY
const createProject = (metadata) => __awaiter(void 0, void 0, void 0, function* () {
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
    try {
        // Store in JSON DB as key-value pair for O(1) access
        yield (0, db_service_1.setVal)(`/projects/${id}`, newProject);
        return newProject;
    }
    catch (error) {
        console.error("DB Create Error:", error);
        throw new Error("Failed to create project in DB");
    }
});
exports.createProject = createProject;
const getProject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, db_service_1.getVal)(`/projects/${id}`);
        if (!data)
            return null;
        // Ensure Dates are Date objects (JSON stores as strings)
        return Object.assign(Object.assign({}, data), { createdAt: new Date(data.createdAt), updatedAt: new Date(data.updatedAt) });
    }
    catch (error) {
        console.error("DB Get Error:", error);
        return null;
    }
});
exports.getProject = getProject;
const updateProject = (id, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const current = yield (0, exports.getProject)(id);
        if (!current)
            return;
        const updated = Object.assign(Object.assign(Object.assign({}, current), updates), { updatedAt: new Date(), 
            // Merger deep objects if necessary, but Partial<BookProject> usually replaces top-level keys
            // metadata is handled separately usually, but if passed here, we merge it
            metadata: updates.metadata ? Object.assign(Object.assign({}, current.metadata), updates.metadata) : current.metadata });
        yield (0, db_service_1.setVal)(`/projects/${id}`, updated);
    }
    catch (error) {
        console.error("DB Update Error", error);
    }
});
exports.updateProject = updateProject;
const updateMetadata = (id, metadataUpdates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const current = yield (0, exports.getProject)(id);
        if (!current)
            return;
        const updated = Object.assign(Object.assign({}, current), { metadata: Object.assign(Object.assign({}, current.metadata), metadataUpdates), updatedAt: new Date() });
        yield (0, db_service_1.setVal)(`/projects/${id}`, updated);
    }
    catch (error) {
        console.error("DB Metadata Update Error", error);
    }
});
exports.updateMetadata = updateMetadata;
const getProjectByEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allProjects = yield (0, db_service_1.getVal)('/projects');
        if (!allProjects)
            return null;
        const projectsList = Object.values(allProjects);
        // Filter by Email
        // Note: Project metadata might use 'contact.email' or just rely on authorName locally?
        // Check `createProject` usage -> metadata includes contact
        const userProjects = projectsList.filter(p => { var _a, _b, _c; return ((_c = (_b = (_a = p.metadata) === null || _a === void 0 ? void 0 : _a.contact) === null || _b === void 0 ? void 0 : _b.email) === null || _c === void 0 ? void 0 : _c.toLowerCase().trim()) === email.toLowerCase().trim(); });
        if (userProjects.length === 0)
            return null;
        // Sort by Created At Descending
        userProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Prioritize UNFINISHED projects for resuming
        const activeProject = userProjects.find(p => p.metadata.status !== 'COMPLETED' &&
            p.metadata.status !== 'LIVRO ENTREGUE' &&
            p.metadata.status !== 'FAILED');
        const selected = activeProject || userProjects[0];
        // Format dates
        return Object.assign(Object.assign({}, selected), { createdAt: new Date(selected.createdAt), updatedAt: new Date(selected.updatedAt) });
    }
    catch (error) {
        console.error("DB GetByEmail Error", error);
        return null;
    }
});
exports.getProjectByEmail = getProjectByEmail;
