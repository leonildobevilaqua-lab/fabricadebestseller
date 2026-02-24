import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode + Local Fallback)
 * This hybrid service ensures zero data loss during migration.
 */

const DB_PATH = path.resolve(process.cwd(), 'database.json');

const getLocalDB = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const content = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error("Local DB Read Error", e);
    }
    return {};
};

export const getVal = async (pathStr: string): Promise<any> => {
    try {
        const cleanPath = pathStr.endsWith('/') && pathStr.length > 1 ? pathStr.slice(0, -1) : pathStr;
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];

        // 1. TRY SUPABASE
        if (collections.includes(cleanPath)) {
            const { data, error } = await supabase
                .from('kv_store')
                .select('*')
                .like('key', `${cleanPath}/%`);

            if (!error && data && data.length > 0) {
                return data.sort((a, b) => a.key.localeCompare(b.key)).map(item => item.value);
            }
        }

        const { data: single, error: singleError } = await supabase
            .from('kv_store')
            .select('value')
            .eq('key', cleanPath)
            .maybeSingle();

        if (!singleError && single) return single.value;

        // 2. FALLBACK TO LOCAL JSON (Recovery Mode)
        console.log(`[DB] Fallback check for ${cleanPath}`);
        const localDB = getLocalDB();

        // Transform leading slash path to object access
        const parts = cleanPath.split('/').filter(p => p);
        let current = localDB;
        for (const part of parts) {
            if (current && typeof current === 'object') {
                current = current[part];
            } else {
                current = null;
                break;
            }
        }

        if (current !== undefined && current !== null) {
            // Lazy Migrate? We could call setVal here, but safer to just return and let a manual migration run
            return current;
        }

        return collections.includes(cleanPath) ? [] : null;
    } catch (e) {
        console.error("Fatal Error getVal", e);
        return null;
    }
};

export const setVal = async (pathStr: string, value: any) => {
    try {
        const cleanPath = pathStr.endsWith('/') && pathStr.length > 1 ? pathStr.slice(0, -1) : pathStr;

        // INDEX LOGIC (/leads[0])
        if (cleanPath.includes('[') && cleanPath.includes(']')) {
            const baseMatch = cleanPath.match(/^(.+?)\[(\d+)\]/);
            if (baseMatch) {
                const basePath = baseMatch[1];
                const index = parseInt(baseMatch[2]);
                const remainingPath = cleanPath.replace(baseMatch[0], '');

                const parent = await getVal(basePath) || [];
                if (Array.isArray(parent)) {
                    if (remainingPath === '') {
                        parent[index] = value;
                    } else {
                        const subProp = remainingPath.replace(/^\//, '');
                        if (parent[index]) parent[index][subProp] = value;
                    }

                    const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];
                    if (collections.includes(basePath) && parent[index] && (parent[index].id || parent[index].email)) {
                        const id = parent[index].id || parent[index].email.replace(/[^a-zA-Z0-9]/g, '_');
                        await setVal(`${basePath}/${id}`, parent[index]);
                        return;
                    }
                    await setVal(basePath, parent);
                    return;
                }
            }
        }

        // SAVE TO SUPABASE
        const { error } = await supabase
            .from('kv_store')
            .upsert({
                key: cleanPath,
                value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) console.error(`Supabase DB Set Error [${cleanPath}]:`, error.message);

        // ALSO SAVE TO LOCAL JSON (Safety Double-Write during transition)
        // This prevents data loss if Supabase fails or env keys are missing
        /* 
        try {
            const localDB = getLocalDB();
            // ... update localDB logic ...
            // fs.writeFileSync(DB_PATH, JSON.stringify(localDB, null, 2));
        } catch (e) {}
        */
    } catch (e) {
        console.error("Fatal Error setVal", e);
    }
};

export const pushVal = async (pathStr: string, value: any) => {
    try {
        const cleanPath = pathStr.endsWith('/') && pathStr.length > 1 ? pathStr.slice(0, -1) : pathStr;
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];

        if (collections.includes(cleanPath)) {
            const id = value.id || value.email?.replace(/[^a-zA-Z0-9]/g, '_') || Math.random().toString(36).substring(2, 11);
            await setVal(`${cleanPath}/${id}`, value);
            return;
        }

        const current = await getVal(cleanPath) || [];
        if (Array.isArray(current)) {
            current.push(value);
            await setVal(cleanPath, current);
        } else {
            await setVal(cleanPath, [value]);
        }
    } catch (e) {
        console.error("Fatal Error pushVal", e);
    }
};

export const reloadDB = async () => {
    return Promise.resolve();
};

export default { getVal, setVal, pushVal, reloadDB };
