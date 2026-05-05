import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode + Local Fallback)
 * Extremely resilient version to ensure data visibility.
 * Last updated: 2026-03-17 16:14 (Trigger for Coolify redeploy)
 */

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

const getIndividualKey = async (normalizedPath: string): Promise<any> => {
    const possibleKeys = [normalizedPath, normalizedPath.startsWith('/') ? normalizedPath.substring(1) : '/' + normalizedPath];
    for (const k of possibleKeys) {
        const { data, error } = await supabase
            .from('kv_store')
            .select('value')
            .eq('key', k)
            .maybeSingle();

        if (!error && data) {
            const val = data.value;
            return typeof val === 'string' ? JSON.parse(val) : val;
        }
    }
    return null;
};

export const getVal = async (pathStr: string, options: { fields?: string, forceSync?: boolean } = {}): Promise<any> => {
    try {
        if (!pathStr) return null;
        
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
        
        // 0. COLLECTIONS CONFIG
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders'];
        const isCollectionRoot = collections.includes(normalized);

        // 1. LOCAL CACHE FIRST (Instant) - Skip if forceSync is active
        const localDB = getLocalDB();
        if (!options.forceSync && !isCollectionRoot && localDB[normalized]) {
            const val = localDB[normalized];
            console.log(`[DB] Serving key ${normalized} from Memory Cache (Instant)`);
            
            // Background Sync (Optional: trigger a re-fetch to keep cache fresh if needed)
            return typeof val === 'string' ? JSON.parse(val) : val;
        }

        if (!options.forceSync && isCollectionRoot) {
            const results: any[] = [];
            try {
                for (const [k, v] of Object.entries(localDB)) {
                    if (k && k.startsWith(`${normalized}/`)) {
                        try {
                            const val = typeof v === 'string' ? JSON.parse(v) : v;
                            if (val) results.push(val);
                        } catch (e) { console.warn(`[DB] Error parsing key ${k}`); }
                    }
                }
            } catch (e) { console.error("[DB] Cache loop error", e); }

            if (results.length > 0) {
                console.log(`[DB] Serving collection ${normalized} from Memory Cache (Instant)`);
                return results.sort((a: any, b: any) => {
                    const da = new Date(a?.updated_at || a?.date || a?.createdAt || 0).getTime();
                    const db = new Date(b?.updated_at || b?.date || b?.createdAt || 0).getTime();
                    return db - da;
                });
            }
        }

        // 2. SUPABASE FALLBACK (Triggered ONLY if really empty, but non-blocking preferred)
        if (isCollectionRoot) {
            if (options.forceSync) {
                console.log(`[DB] Collection ${normalized} - Forced Real-time Fetch...`);
                let selectFields = options.fields || 'key, value, updated_at';
                const { data: rawItems, error } = await supabase.from('kv_store').select(selectFields).like('key', `${normalized}/%`).limit(2000);
                
                if (!error && rawItems) {
                    const syncedResults: any[] = [];
                    const localDB = getLocalDB();
                    rawItems.forEach((item: any) => {
                        try {
                            let val = item.value;
                            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val);
                            else if (typeof val === 'string') val = { value: val };
                            val = val || (item.metadata || {});
                            const parsed = { ...val, id: val.id || item.key.split('/').pop(), key: item.key, updated_at: item.updated_at };
                            localDB[item.key] = parsed;
                            syncedResults.push(parsed);
                        } catch (e) {}
                    });
                    cachedLocalDB = localDB;
                    return syncedResults.sort((a: any, b: any) => {
                        const da = new Date(a?.updated_at || a?.date || a?.createdAt || 0).getTime();
                        const db = new Date(b?.updated_at || b?.date || b?.createdAt || 0).getTime();
                        return db - da;
                    });
                }
            }

            console.log(`[DB] Collection ${normalized} missing from cache. Syncing in background...`);
            
            // Start background sync but don't wait for it if we want instant response
            const syncPromise = (async () => {
                try {
                    let selectFields = options.fields || 'key, value, updated_at';
                    if (!options.fields) {
                        if (normalized === '/projects') selectFields = 'key, updated_at, metadata:value->metadata';
                        else if (normalized === '/leads') selectFields = 'key, updated_at, value';
                    }

                    // Use a race to enforce a strict timeout even for the fetch
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000));
                    const fetchPromise = supabase
                        .from('kv_store')
                        .select(selectFields)
                        .like('key', `${normalized}/%`)
                        .limit(2000);

                    const { data: rawItems } = await Promise.race([fetchPromise, timeoutPromise]) as any;

                    if (rawItems && rawItems.length > 0) {
                        const localDB = getLocalDB();
                        rawItems.forEach((item: any) => {
                            try {
                                let val = item.value;
                                if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) val = JSON.parse(val);
                                else if (typeof val === 'string') val = { value: val };
                                val = val || (item.metadata || {});
                                localDB[item.key] = { ...val, id: val.id || item.key.split('/').pop(), key: item.key, updated_at: item.updated_at };
                            } catch (e) {}
                        });
                        cachedLocalDB = localDB;
                    }
                } catch (e) { console.warn(`[DB] Background sync failed for ${normalized} (Service possibly slow/down)`); }
            })();

            return []; 
        } else {
            const possibleKeys = [normalized, normalized.startsWith('/') ? normalized.substring(1) : '/' + normalized];
            for (const k of possibleKeys) {
                try {
                    // Increased timeout to 5s for Production Stability
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
                    const fetchPromise = supabase.from('kv_store').select('value').eq('key', k).maybeSingle();
                    
                    const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
                    if (result && result.data) {
                        const val = result.data.value;
                        let parsed = val;
                        try {
                            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) parsed = JSON.parse(val);
                            else if (typeof val === 'string') parsed = { value: val };
                        } catch(e) {}
                        
                        const localDB = getLocalDB();
                        localDB[normalized] = parsed;
                        cachedLocalDB = localDB;
                        console.log(`[DB] Successfully fetched and cached individual key: ${normalized}`);
                        return parsed;
                    }
                } catch (e: any) { 
                    console.warn(`[DB] Fetch failed or timed out for ${k}:`, e.message); 
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

        // 1. UPDATE MEMORY CACHE IMMEDIATELY
        try {
            const db = getLocalDB();
            db[normalized] = value;
            cachedLocalDB = db;
        } catch (e) { console.error("[DB] Cache write error", e); }

        // INDEX LOGIC (/leads[0]) - Maintain compatibility with older controller styles
        if (normalized.includes('[') && normalized.includes(']')) {
            const baseMatch = normalized.match(/^(.+?)\[(\d+)\]/);
            if (baseMatch) {
                const basePath = baseMatch[1];
                const index = parseInt(baseMatch[2]);
                const remainingPath = normalized.replace(baseMatch[0], '');

                const parent = await getVal(basePath) || [];
                if (Array.isArray(parent)) {
                    if (remainingPath === '') {
                        parent[index] = value;
                    } else {
                        const subProp = remainingPath.replace(/^\//, '');
                        if (parent[index]) parent[index][subProp] = value;
                    }

                    // Special: If updating a collection member, save to its unique key too
                    const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders'];
                    if (collections.includes(basePath) && parent[index]) {
                        const id = parent[index].id || parent[index].email?.replace(/[^a-zA-Z0-9]/g, '_');
                        if (id) await setVal(`${basePath}/${id}`, parent[index]);
                    }
                    await setVal(basePath, parent); // Still save to root for safety
                    return;
                }
            }
        }

        // 2. SAVE TO SUPABASE (Non-blocking background sync)
        supabase
            .from('kv_store')
            .upsert({
                key: normalized,
                value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' })
            .then(({ error }) => {
                if (error) console.error(`[DB] Background Sync Error for ${normalized}:`, error.message);
            });

        // 3. PROACTIVE LOCAL BACKUP (Disk)
        setTimeout(async () => {
            try {
                const db = getLocalDB();
                const json = JSON.stringify(db);
                fs.writeFile(DB_PATH, json, (err) => {
                    if (err) console.error("[DB] Proactive Backup Error:", err);
                });
            } catch (localErr) {
                console.error("[DB] Proactive Backup Serialization Error:", localErr);
            }
        }, 0);

    } catch (e) {
        console.error("setVal error:", e);
    }

};

export const pushVal = async (pathStr: string, value: any) => {
    try {
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders'];

        if (collections.includes(normalized)) {
            const id = value.id || value.email?.replace(/[^a-zA-Z0-9]/g, '_') || Math.random().toString(36).substring(2, 11);
            await setVal(`${normalized}/${id}`, value);
            return;
        }

        const current = await getVal(normalized) || [];
        if (Array.isArray(current)) {
            current.push(value);
            await setVal(normalized, current);
        } else {
            await setVal(normalized, [value]);
        }
    } catch (e) { }
};

export const deleteVal = async (pathStr: string) => {
    try {
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders'];

        if (collections.includes(normalized)) {
            await supabase.from('kv_store').delete().like('key', `${normalized}%`);
        } else {
            await supabase.from('kv_store').delete().eq('key', normalized);
            await supabase.from('kv_store').delete().eq('key', normalized.startsWith('/') ? normalized.substring(1) : normalized);
        }
    } catch (e) { }
};

export const reloadDB = async () => {
    cachedLocalDB = null;
    console.log("[DB] Memory Cache cleared. Next request will be forced to sync with Supabase.");
    return Promise.resolve();
};

export default { getVal, setVal, pushVal, deleteVal, reloadDB };
