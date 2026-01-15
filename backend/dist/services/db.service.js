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
exports.reloadDB = exports.pushVal = exports.setVal = exports.getVal = void 0;
const supabase_1 = require("./supabase");
const TABLE = 'kv_store';
// Helper to parse complex paths like "leads[0]/status"
// Returns { root: 'leads', path: ['0', 'status'] }
const parsePath = (fullPath) => {
    // Remove leading slash
    let p = fullPath.startsWith('/') ? fullPath.slice(1) : fullPath;
    if (!p)
        return { root: 'root', path: [] };
    // Regex to tokenise parts including brackets
    // e.g. "leads[0]/status" -> ["leads", "0", "status"]
    // Simple split by / first
    const segments = p.split('/').filter(x => x);
    const finalParts = [];
    for (const seg of segments) {
        // Match name[index] or name[index][index2]
        // Simple regex for name[123]
        const match = seg.match(/^([^\[]+)((?:\[\d+\])+)$/);
        if (match) {
            finalParts.push(match[1]);
            // parse [0][1]...
            const indices = match[2].match(/\[(\d+)\]/g);
            if (indices) {
                indices.forEach(idx => finalParts.push(idx.replace(/[\[\]]/g, '')));
            }
        }
        else {
            finalParts.push(seg);
        }
    }
    if (finalParts.length === 0)
        return { root: 'root', path: [] };
    // First part is the Root Key in KV Store
    return { root: finalParts[0], path: finalParts.slice(1) };
};
// Deep get
const getDeep = (obj, path) => {
    let current = obj;
    for (const key of path) {
        if (current === undefined || current === null)
            return undefined;
        current = current[key];
    }
    return current;
};
// Deep set
const setDeep = (obj, path, value) => {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (current[key] === undefined || current[key] === null) {
            // Determine if next key is number -> array
            const nextKey = path[i + 1];
            current[key] = !isNaN(Number(nextKey)) ? [] : {};
        }
        current = current[key];
    }
    current[path[path.length - 1]] = value;
};
const getVal = (path) => __awaiter(void 0, void 0, void 0, function* () {
    const { root, path: subPath } = parsePath(path);
    try {
        const { data, error } = yield supabase_1.supabase
            .from(TABLE)
            .select('value')
            .eq('key', root)
            .single();
        if (error || !data)
            return null;
        if (subPath.length === 0)
            return data.value;
        return getDeep(data.value, subPath);
    }
    catch (e) {
        console.error(`DB Get Error (${path})`, e);
        return null;
    }
});
exports.getVal = getVal;
const setVal = (path, value) => __awaiter(void 0, void 0, void 0, function* () {
    const { root, path: subPath } = parsePath(path);
    try {
        // Locking/Concurrency is ignored here for simplicity in this migration.
        // We fetch the full root object, modify, and save.
        const { data } = yield supabase_1.supabase
            .from(TABLE)
            .select('value')
            .eq('key', root)
            .single();
        let rootObj = (data === null || data === void 0 ? void 0 : data.value) || {}; // logic: if leads doesnt exist, start with {} or []?
        // If rootObj is empty but we are setting 'leads', we might expect it to vary.
        // However, node-json-db usually initializes roots.
        // Handling array vs object at root
        // If 'rootObj' is {} but path implies array idx?
        // e.g. setVal('/leads[0]', ...) -> root='leads', path=['0'].
        // If rootObj is {}, rootObj['0'] = val. It becomes {'0': val}.
        // If the user expected an array, this is slightly wrong but functional for JSON.
        // Ideally we check if 'leads' was meant to be array.
        // For now, reliance on JS looseness.
        if (subPath.length === 0) {
            // Replace root
            rootObj = value;
        }
        else {
            setDeep(rootObj, subPath, value);
        }
        const { error } = yield supabase_1.supabase
            .from(TABLE)
            .upsert({ key: root, value: rootObj });
        if (error)
            console.error("DB Write Error", error);
    }
    catch (e) {
        console.error(`DB Set Error (${path})`, e);
    }
});
exports.setVal = setVal;
const pushVal = (path, value) => __awaiter(void 0, void 0, void 0, function* () {
    // node-json-db push: Adds to array
    const { root, path: subPath } = parsePath(path);
    try {
        const { data } = yield supabase_1.supabase.from(TABLE).select('value').eq('key', root).single();
        let rootObj = (data === null || data === void 0 ? void 0 : data.value) || (subPath.length === 0 ? [] : {});
        if (subPath.length === 0) {
            if (!Array.isArray(rootObj))
                rootObj = []; // Enforce array if replacing root with push
            rootObj.push(value);
        }
        else {
            let target = getDeep(rootObj, subPath);
            if (!Array.isArray(target)) {
                target = [];
                setDeep(rootObj, subPath, target);
            }
            target.push(value);
        }
        yield supabase_1.supabase.from(TABLE).upsert({ key: root, value: rootObj });
    }
    catch (e) {
        console.error("DB Push Error", e);
    }
});
exports.pushVal = pushVal;
const reloadDB = () => __awaiter(void 0, void 0, void 0, function* () {
    // No-op for Supabase
});
exports.reloadDB = reloadDB;
exports.default = { getVal: exports.getVal, setVal: exports.setVal, pushVal: exports.pushVal, reloadDB: exports.reloadDB };
