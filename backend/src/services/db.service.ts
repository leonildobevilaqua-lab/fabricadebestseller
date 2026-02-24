import { supabase } from './supabase';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode)
 * Replaces node-json-db with persistent cloud storage.
 * Optimized for performance and compatibility with large collections.
 */

export const getVal = async (path: string): Promise<any> => {
    try {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // COLLECTION LOGIC: If fetching a major branch, return all sub-keys as an ARRAY
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];
        if (collections.includes(cleanPath)) {
            console.log(`[DB] Fetching collection: ${cleanPath}`);
            const { data, error } = await supabase
                .from('kv_store')
                .select('*')
                .filter('key', 'like', `${cleanPath}/%`);

            if (error) {
                console.warn(`Supabase collections error [${cleanPath}]:`, error.message);
                return [];
            }
            if (!data || data.length === 0) {
                // FALLBACK: maybe it's stored as a single document? (Legacy/Migration)
                const { data: single } = await supabase
                    .from('kv_store')
                    .select('value')
                    .eq('key', cleanPath)
                    .maybeSingle();
                return single?.value || [];
            }

            // Return as sorted array to maintain order consistent with old JSON DB
            return data
                .sort((a, b) => a.key.localeCompare(b.key))
                .map(item => item.value);
        }

        // SINGLE VALUE LOGIC
        const { data, error } = await supabase
            .from('kv_store')
            .select('value')
            .eq('key', cleanPath)
            .maybeSingle();

        if (error) {
            console.error(`Supabase DB Get Error [${cleanPath}]:`, error.message);
            return null;
        }
        return data?.value || null;
    } catch (e) {
        console.error("Fatal Error getVal", e);
        return null;
    }
};

export const setVal = async (path: string, value: any) => {
    try {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // INDEX LOGIC: If path is like /leads[0], handle it as a sub-document update
        if (cleanPath.includes('[') && cleanPath.includes(']')) {
            const baseMatch = cleanPath.match(/^(.+?)\[(\d+)\]/);
            if (baseMatch) {
                const basePath = baseMatch[1];
                const index = parseInt(baseMatch[2]);
                const remainingPath = cleanPath.replace(baseMatch[0], '');

                const parent = await getVal(basePath) || [];
                if (Array.isArray(parent)) {
                    // We need to know the KEY of the document at this index
                    // Because in "Collection Mode", indices are virtual.
                    // This is tricky. For now, let's allow it if stored as a single document.
                    // But if it's a collection, we should avoid [index] and use ID.
                    // Since controllers use [index], we'll fetch full collection, update, and re-save if single doc.

                    if (remainingPath === '') {
                        parent[index] = value;
                    } else {
                        const subProp = remainingPath.replace(/^\//, '');
                        if (parent[index]) parent[index][subProp] = value;
                    }

                    // Optimization: If it's a known collection, find the ID and update ONLY that row
                    const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];
                    if (collections.includes(basePath) && parent[index] && parent[index].id) {
                        const subKey = `${basePath}/${parent[index].id}`;
                        await setVal(subKey, parent[index]);
                        return;
                    }

                    // Fallback: update the whole list (if stored as single doc)
                    await setVal(basePath, parent);
                    return;
                }
            }
        }

        const { error } = await supabase
            .from('kv_store')
            .upsert({
                key: cleanPath,
                value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) console.error(`Supabase DB Set Error [${cleanPath}]:`, error.message);
    } catch (e) {
        console.error("Fatal Error setVal", e);
    }
};

export const pushVal = async (path: string, value: any) => {
    try {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // COLLECTION LOGIC: If pushing to a collection, save as individual row with sub-key
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];
        if (collections.includes(cleanPath)) {
            const id = value.id || Math.random().toString(36).substring(2, 11);
            const subKey = `${cleanPath}/${id}`;
            console.log(`[DB] Pushing to collection ${cleanPath} -> ${subKey}`);
            await setVal(subKey, value);
            return;
        }

        // FETCH atual do array (for non-collections)
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
