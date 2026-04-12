import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode + Local Fallback)
 * Extremely resilient version to ensure data visibility.
 * Last updated: 2026-03-17 16:14 (Trigger for Coolify redeploy)
 */

const DB_PATH = path.resolve(process.cwd(), 'database.json');

const getLocalDB = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const stats = fs.statSync(DB_PATH);
            if (stats.size > 1024 * 1024 * 50) {
                console.warn(`[DB] Local DB is large: ${Math.round(stats.size / 1024 / 1024)}MB. Optimization active.`);
            }
            const content = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(content);
        }
    } catch (e) { 
        console.error("[DB] getLocalDB error:", e);
    }
    return {};
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

export const getVal = async (pathStr: string): Promise<any> => {
    try {
        if (!pathStr) return null;
        
        const cleanPath = pathStr.startsWith('/') ? pathStr : '/' + pathStr;
        const normalized = (cleanPath.endsWith('/') && cleanPath.length > 1) ? cleanPath.slice(0, -1) : cleanPath;
        
        // 0. COLLECTIONS CONFIG
        const collections = ['/projects', '/leads', '/users', '/credits', '/orders', '/extra_orders'];
        const isCollectionRoot = collections.includes(normalized);

        // 1. SUPABASE PRIMARY: Check Supabase First
        if (isCollectionRoot) {
            let allItems: any[] = [];
            console.log(`[DB] Fetching collection: ${normalized}`);

            const { data: rawItems, error: fetchErr } = await supabase
                .from('kv_store')
                .select('key, value, updated_at')
                .like('key', `${normalized}/%`)
                .limit(5000); // FIX: Ensure we don't hit the default 100 limit as collection grows

            if (fetchErr) {
                console.error(`[DB] Supabase Fetch Error (${normalized}):`, fetchErr);
            }

            if (rawItems && rawItems.length > 0) {
                // IMPORTANT: Filter out sub-keys (e.g., skip /projects/ID/metadata/translations if fetching /projects)
                // We only want items that are DIRECT children of the collection root.
                const filteredItems = rawItems.filter(item => {
                    const suffix = item.key.substring(normalized.length + 1);
                    return !suffix.includes('/'); 
                });

                console.log(`[DB] Found ${filteredItems.length} valid items for ${normalized} (Filtered ${rawItems.length - filteredItems.length} sub-keys)`);
                
                allItems = filteredItems.map(item => {
                    try {
                        const val = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
                        if (val && typeof val === 'object' && !Array.isArray(val)) {
                            return {
                                ...val,
                                id: val.id || item.key.split('/').pop(),
                                key: item.key,
                                updated_at: item.updated_at
                            };
                        }
                        return val;
                    } catch (e) { return item.value; }
                });
            }

            // [CRITICAL] 3. Sync with legacy Root Array if exists (e.g. data still in database.json or root key)
            const rootVal = await getIndividualKey(normalized);
            if (rootVal && Array.isArray(rootVal)) {
                 console.log(`[DB] Merging ${rootVal.length} legacy items from root key ${normalized}`);
                 allItems = [...allItems, ...rootVal];
            }

            return allItems.sort((a, b) => {
                const da = new Date(a?.updated_at || a?.date || a?.createdAt || 0).getTime();
                const db = new Date(b?.updated_at || b?.date || b?.createdAt || 0).getTime();
                return db - da; // Newer first
            });
        }

        // 2. SUPABASE EXACT MATCH
        const possibleKeys = [normalized, normalized.startsWith('/') ? normalized.substring(1) : '/' + normalized];
        
        for (const k of possibleKeys) {
            const { data, error } = await supabase
                .from('kv_store')
                .select('value')
                .eq('key', k)
                .maybeSingle();

            if (error) {
                console.error(`[DB] Supabase error fetching exact key ${k}:`, error.message);
            }

            if (!error && data) {
                const val = data.value;
                console.log(`[DB] Serving key ${normalized} from Supabase`);
                return typeof val === 'string' ? JSON.parse(val) : val;
            }
        }

        // 3. FALLBACK TO LOCAL JSON (Proactive Safety)
        const localDB = getLocalDB();
        
        if (isCollectionRoot) {
            const results: any[] = [];
            for (const [k, v] of Object.entries(localDB)) {
                if (k.startsWith(`${normalized}/`)) {
                    const parsed = typeof v === 'string' ? JSON.parse(v) : v;
                    results.push(parsed);
                }
            }
            if (results.length > 0) {
                console.log(`[DB] Serving collection ${normalized} from localDB (Fallback)`);
                return results;
            }
        }

        if (localDB[normalized]) {
            const val = localDB[normalized];
            console.log(`[DB] Serving key ${normalized} from localDB (Fallback)`);
            return typeof val === 'string' ? JSON.parse(val) : val;
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

        // SAVE TO SUPABASE
        await supabase
            .from('kv_store')
            .upsert({
                key: normalized,
                value: value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        // 3. PROACTIVE LOCAL BACKUP (Safety for VPS restarts/sync issues)
        // [OPTIMIZATION] Non-blocking async write + removed indentation to save memory/cpu
        setTimeout(async () => {
            try {
                const db = getLocalDB();
                db[normalized] = value;
                const json = JSON.stringify(db); // No indentation (null, 2)
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

export const reloadDB = async () => Promise.resolve();

export default { getVal, setVal, pushVal, deleteVal, reloadDB };
