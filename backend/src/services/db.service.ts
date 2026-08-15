
import { supabase } from './supabase';
import { databases, APPWRITE_CONFIG } from './appwrite.service';
import { ID, Query } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

/**
 * DATABASE PERSISTENCE SERVICE (Hybrid: Supabase / Appwrite / Local)
 * This version supports switching providers via DB_PROVIDER env var.
 * Default is 'supabase' for backward compatibility.
 */

const DB_PROVIDER = process.env.DB_PROVIDER || 'supabase';

export const getDatabasePath = (): string => {
    let currentDir = __dirname;
    while (currentDir) {
        const potentialDb = path.join(currentDir, 'database.json');
        if (fs.existsSync(potentialDb) && fs.statSync(potentialDb).size > 10000) {
            return potentialDb;
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir) break;
        currentDir = parent;
    }
    return path.resolve(process.cwd(), 'database.json');
};

const DB_PATH = getDatabasePath();

let cachedLocalDB: any = null;

const getLocalDB = () => {
    if (cachedLocalDB) return cachedLocalDB;
    try {
        if (fs.existsSync(DB_PATH)) {
            const stats = fs.statSync(DB_PATH);
            const content = fs.readFileSync(DB_PATH, 'utf-8');
            cachedLocalDB = JSON.parse(content);
            console.log(`[DB] Local DB loaded into memory: ${Math.round(stats.size / 1024)}KB`);
            return cachedLocalDB;
        }
    } catch (e) { 
        console.error("[DB] getLocalDB error:", e);
    }
    cachedLocalDB = {};
    return cachedLocalDB;
};

export const getVal = async (pathStr: string, options: { fields?: string, forceSync?: boolean } = {}): Promise<any> => {
    try {
        if (!pathStr) return null;
        
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
        
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders', '/cipCredits', '/barcodeCredits', '/qrCredits', '/coverCredits'];
        const isCollectionRoot = collections.includes(normalized);

        // 1. LOCAL CACHE FIRST
        const localDB = getLocalDB();
        if (!options.forceSync && !isCollectionRoot && localDB[normalized]) {
            const val = localDB[normalized];
            return typeof val === 'string' ? JSON.parse(val) : val;
        }

        if (!options.forceSync && isCollectionRoot) {
            const results: any[] = [];
            for (const [k, v] of Object.entries(localDB)) {
                if (k && k.startsWith(`${normalized}/`)) {
                    try {
                        const val = typeof v === 'string' ? JSON.parse(v) : v;
                        if (val && typeof val === 'object') {
                            if (!val.metadata) val.metadata = val;
                            results.push(val);
                        }
                    } catch (e) {}
                }
            }
            if (results.length > 0) {
                return results.sort((a: any, b: any) => {
                    const da = new Date(a?.updated_at || a?.date || a?.createdAt || 0).getTime();
                    const db = new Date(b?.updated_at || b?.date || b?.createdAt || 0).getTime();
                    return db - da;
                });
            }
        }

        // 2. REMOTE FETCH (PROVIDER BASED)
        let remoteData: any = null;
        let remoteSuccess = false;

        if (DB_PROVIDER === 'appwrite') {
            try {
                if (isCollectionRoot) {
                    const response = await databases.listDocuments(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        [Query.startsWith('key', `${normalized}/`), Query.limit(2000)]
                    );
                    
                    remoteData = response.documents.map(doc => {
                        let val = doc.value;
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val);
                        const parsed = { ...val, id: val.id || doc.key.split('/').pop(), key: doc.key, updated_at: doc.$updatedAt };
                        localDB[doc.key] = parsed;
                        return parsed;
                    });
                    remoteSuccess = true;
                } else {
                    const response = await databases.listDocuments(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        [Query.equal('key', normalized), Query.limit(1)]
                    );
                    if (response.documents.length > 0) {
                        const doc = response.documents[0];
                        let parsed = doc.value;
                        if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) parsed = JSON.parse(parsed);
                        localDB[normalized] = parsed;
                        remoteData = parsed;
                        remoteSuccess = true;
                    }
                }
            } catch (e) {
                console.error("[DB] Appwrite Fetch Error:", e);
            }
        } else {
            // SUPABASE LOGIC (Robust Collection & Sub-key Fetch)
            try {
                if (isCollectionRoot) {
                    const collectionItems: any[] = [];
                    const seenIds = new Set<string>();

                    // A. Check root key (e.g. key = "/leads" or key = "/orders")
                    try {
                        const { data: rootRow } = await supabase.from('kv_store').select('key, value, updated_at').eq('key', normalized).maybeSingle();
                        if (rootRow && rootRow.value) {
                            let rootVal = rootRow.value;
                            if (typeof rootVal === 'string' && (rootVal.startsWith('{') || rootVal.startsWith('['))) {
                                try { rootVal = JSON.parse(rootVal); } catch (e) {}
                            }
                            const rawArr = Array.isArray(rootVal) ? rootVal : (typeof rootVal === 'object' ? Object.values(rootVal) : []);
                            for (const item of rawArr) {
                                if (item && typeof item === 'object') {
                                    const id = item.id || item.key || JSON.stringify(item).slice(0, 30);
                                    if (!seenIds.has(id)) {
                                        seenIds.add(id);
                                        collectionItems.push(item);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("[DB] Root collection row fetch error:", e);
                    }

                    // B. Check sub-keys (e.g. key >= "/projects/" && key < "/projects0")
                    let selectFields = options.fields || 'key, value, updated_at';
                    if (!options.fields && normalized === '/projects') {
                        // Light select for projects to prevent query timeout while keeping metadata intact
                        selectFields = 'key, updated_at, value->metadata, value->id, value->createdAt, value->customerEmail';
                    }

                    let rawItems: any[] = [];
                    let from = 0;
                    let limit = 1000;
                    while (true) {
                        const { data: rawItemsData, error } = await supabase
                            .from('kv_store')
                            .select(selectFields)
                            .gte('key', `${normalized}/`)
                            .lt('key', `${normalized}0`)
                            .order('key', { ascending: true })
                            .range(from, from + limit - 1);
                            
                        if (error) {
                            console.error("[DB] Supabase Fetch Error (Pagination):", error);
                            break;
                        }
                        if (!rawItemsData || rawItemsData.length === 0) break;
                        rawItems = rawItems.concat(rawItemsData);
                        if (rawItemsData.length < limit) break;
                        from += limit;
                    }

                    if (rawItems.length > 0) {
                        for (const item of rawItems) {
                            let val = item.value || {};
                            let metadata = item.metadata || (val && val.metadata) || {};

                            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                                try { val = JSON.parse(val); } catch (e) {}
                            }
                            if (typeof metadata === 'string' && (metadata.startsWith('{') || metadata.startsWith('['))) {
                                try { metadata = JSON.parse(metadata); } catch (e) {}
                            }

                            if (!metadata && val && typeof val === 'object') {
                                metadata = val.metadata || val;
                            }

                            if (val !== null && val !== undefined) {
                                const projId = item.id || (val && val.id) || (metadata && metadata.id) || item.key.split('/').pop();
                                const metadataObj = metadata || (val && val.metadata) || (typeof val === 'object' ? val : {});
                                const parsed = {
                                    ...(typeof val === 'object' && val !== null ? val : {}),
                                    ...(typeof metadataObj === 'object' && metadataObj !== null ? metadataObj : {}),
                                    id: projId,
                                    key: item.key,
                                    updated_at: item.updated_at || (val && val.updatedAt),
                                    metadata: metadataObj
                                };

                                localDB[item.key] = parsed;

                                if (!seenIds.has(projId)) {
                                    seenIds.add(projId);
                                    collectionItems.push(parsed);
                                }
                            }
                        }
                    }

                    if (collectionItems.length > 0) {
                        remoteData = collectionItems.sort((a: any, b: any) => {
                            const da = new Date(a?.updated_at || a?.updatedAt || a?.date || a?.createdAt || 0).getTime();
                            const db = new Date(b?.updated_at || b?.updatedAt || b?.date || b?.createdAt || 0).getTime();
                            return db - da;
                        });
                        remoteSuccess = true;
                    }
                } else {
                    const { data, error } = await supabase.from('kv_store').select('value').eq('key', normalized).maybeSingle();
                    if (!error && data) {
                        let parsed = data.value;
                        if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) parsed = JSON.parse(parsed);
                        localDB[normalized] = parsed;
                        remoteData = parsed;
                        remoteSuccess = true;
                    }
                }
            } catch (e) {
                console.error("[DB] Supabase Fetch Error:", e);
            }
        }

        if (remoteSuccess && remoteData) {
            cachedLocalDB = localDB;
            return remoteData;
        }

        // 3. FALLBACK TO LOCAL IF REMOTE FAILED OR RETURNED EMPTY
        if (isCollectionRoot) {
            const results: any[] = [];
            for (const [k, v] of Object.entries(localDB)) {
                if (k && k.startsWith(`${normalized}/`)) {
                    try {
                        const val = typeof v === 'string' ? JSON.parse(v) : v;
                        if (val) results.push(val);
                    } catch (e) {}
                }
            }
            return results.sort((a: any, b: any) => {
                const da = new Date(a?.updated_at || a?.date || a?.createdAt || 0).getTime();
                const db = new Date(b?.updated_at || b?.date || b?.createdAt || 0).getTime();
                return db - da;
            });
        } else {
            const val = localDB[normalized];
            return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null;
        }
    } catch (e) {
        console.error("getVal error:", e);
        return null;
    }
};

export const setVal = async (pathStr: string, value: any) => {
    try {
        if (!pathStr) return;
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;

        // 1. UPDATE MEMORY CACHE
        const db = getLocalDB();
        db[normalized] = value;
        cachedLocalDB = db;

        // 2. REMOTE SYNC (PROVIDER BASED)
        if (DB_PROVIDER === 'appwrite') {
            try {
                // Check if exists for update or create
                const existing = await databases.listDocuments(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collectionId,
                    [Query.equal('key', normalized), Query.limit(1)]
                );

                if (value === null) {
                    if (existing.documents.length > 0) {
                        await databases.deleteDocument(
                            APPWRITE_CONFIG.databaseId,
                            APPWRITE_CONFIG.collectionId,
                            existing.documents[0].$id
                        );
                    }
                } else {
                    const stringifiedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

                    if (existing.documents.length > 0) {
                        await databases.updateDocument(
                            APPWRITE_CONFIG.databaseId,
                            APPWRITE_CONFIG.collectionId,
                            existing.documents[0].$id,
                            { value: stringifiedValue, key: normalized }
                        );
                    } else {
                        await databases.createDocument(
                            APPWRITE_CONFIG.databaseId,
                            APPWRITE_CONFIG.collectionId,
                            ID.unique(),
                            { key: normalized, value: stringifiedValue }
                        );
                    }
                }
            } catch (e: any) {
                console.error("[DB] Appwrite Set Error:", e.message);
            }
        } else {
            // SUPABASE LOGIC
            if (value === null) {
                const { error } = await supabase.from('kv_store').delete().eq('key', normalized);
                if (error) console.error(`[DB] Supabase Delete Error:`, error.message);
            } else {
                const { error } = await supabase.from('kv_store').upsert({
                    key: normalized,
                    value: value,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                
                if (error) console.error(`[DB] Supabase Sync Error:`, error.message);
            }
        }

        // 3. DISK BACKUP (Synchronous to ensure integrity during rapid updates)
        try {
            fs.writeFileSync(DB_PATH, JSON.stringify(db));
        } catch (err) {
            console.error("[DB] Disk Backup Error:", err);
        }

    } catch (e) {
        console.error("setVal error:", e);
    }
};

export const pushVal = async (pathStr: string, value: any) => {
    const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
    const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
    const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders', '/cipCredits', '/barcodeCredits', '/qrCredits', '/coverCredits'];

    if (collections.includes(normalized)) {
        const id = value.id || value.email?.replace(/[^a-zA-Z0-9]/g, '_') || Math.random().toString(36).substring(2, 11);
        await setVal(`${normalized}/${id}`, value);
    } else {
        const current = await getVal(normalized) || [];
        if (Array.isArray(current)) {
            current.push(value);
            await setVal(normalized, current);
        } else {
            await setVal(normalized, [value]);
        }
    }
};

export const deleteVal = async (pathStr: string) => {
    const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
    const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;

    if (DB_PROVIDER === 'appwrite') {
        const existing = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.collectionId,
            [Query.startsWith('key', normalized), Query.limit(100)]
        );
        for (const doc of existing.documents) {
            await databases.deleteDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collectionId, doc.$id);
        }
    } else {
        await supabase.from('kv_store').delete().like('key', `${normalized}%`);
    }
};

export const reloadDB = async () => {
    cachedLocalDB = null;
    return Promise.resolve();
};

export default { getVal, setVal, pushVal, deleteVal, reloadDB };
