
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
const DB_PATH = path.resolve(process.cwd(), 'database.json');

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
        
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders', '/cipCredits', '/barcodeCredits', '/qrCredits'];
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
                        if (val) results.push(val);
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
        if (DB_PROVIDER === 'appwrite') {
            try {
                if (isCollectionRoot) {
                    const response = await databases.listDocuments(
                        APPWRITE_CONFIG.databaseId,
                        APPWRITE_CONFIG.collectionId,
                        [Query.startsWith('key', `${normalized}/`), Query.limit(2000)]
                    );
                    
                    const syncedResults = response.documents.map(doc => {
                        let val = doc.value;
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val);
                        const parsed = { ...val, id: val.id || doc.key.split('/').pop(), key: doc.key, updated_at: doc.$updatedAt };
                        localDB[doc.key] = parsed;
                        return parsed;
                    });
                    cachedLocalDB = localDB;
                    return syncedResults.sort((a: any, b: any) => {
                        const da = new Date(a?.updated_at || 0).getTime();
                        const db = new Date(b?.updated_at || 0).getTime();
                        return db - da;
                    });
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
                        cachedLocalDB = localDB;
                        return parsed;
                    }
                }
            } catch (e) {
                console.error("[DB] Appwrite Fetch Error:", e);
            }
        } else {
            // SUPABASE LOGIC (Original)
            if (isCollectionRoot) {
                let selectFields = options.fields || 'key, value, updated_at';
                if (!options.fields) {
                    if (normalized === '/projects') selectFields = 'key, updated_at, metadata:value->metadata';
                    else if (normalized === '/leads') selectFields = 'key, updated_at, value';
                }

                const { data: rawItems, error } = await supabase.from('kv_store').select(selectFields).like('key', `${normalized}/%`).limit(2000);
                if (!error && rawItems) {
                    const syncedResults = rawItems.map((item: any) => {
                        let val = item.value;
                        if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val);
                        else if (typeof val === 'string') val = { value: val };
                        val = val || (item.metadata || {});
                        
                        const parsed = { ...val, id: val.id || item.key.split('/').pop(), key: item.key, updated_at: item.updated_at };
                        localDB[item.key] = parsed;
                        return parsed;
                    });
                    cachedLocalDB = localDB;
                    return syncedResults;
                }
            } else {
                const { data, error } = await supabase.from('kv_store').select('value').eq('key', normalized).maybeSingle();
                if (!error && data) {
                    let parsed = data.value;
                    if (typeof parsed === 'string' && (parsed.startsWith('{') || parsed.startsWith('['))) parsed = JSON.parse(parsed);
                    localDB[normalized] = parsed;
                    cachedLocalDB = localDB;
                    return parsed;
                }
            }
        }

        return isCollectionRoot ? [] : null;
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
            } catch (e: any) {
                console.error("[DB] Appwrite Set Error:", e.message);
            }
        } else {
            // SUPABASE LOGIC
            const { error } = await supabase.from('kv_store').upsert({
                key: normalized,
                value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            
            if (error) console.error(`[DB] Supabase Sync Error:`, error.message);
        }

        // 3. DISK BACKUP
        fs.writeFile(DB_PATH, JSON.stringify(db), (err) => {
            if (err) console.error("[DB] Disk Backup Error:", err);
        });

    } catch (e) {
        console.error("setVal error:", e);
    }
};

export const pushVal = async (pathStr: string, value: any) => {
    const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
    const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
    const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders', '/cipCredits', '/barcodeCredits', '/qrCredits'];

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
