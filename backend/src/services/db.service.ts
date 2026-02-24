import { supabase } from './supabase';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode)
 * Replaces node-json-db with persistent cloud storage.
 * Maps JSON paths (e.g., /projects/123) to Supabase KV Store.
 */

export const getVal = async (path: string): Promise<any> => {
    try {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

        // COLLECTION LOGIC: If fetching a major branch, return all sub-keys as an object
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits'];
        if (collections.includes(cleanPath)) {
            const { data, error } = await supabase
                .from('kv_store')
                .select('*')
                .filter('key', 'like', `${cleanPath}/%`);

            if (error) {
                console.warn(`Supabase collections error [${cleanPath}]:`, error.message);
                return null;
            }
            if (!data || data.length === 0) return null;

            const collection: any = {};
            data.forEach(item => {
                const parts = item.key.split('/');
                const subKey = parts[parts.length - 1]; // Get last part as key
                if (subKey) collection[subKey] = item.value;
            });
            return collection;
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
        const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits'];
        const isCollection = collections.some(c => cleanPath.startsWith(c));

        if (isCollection) {
            console.warn(`[DB] Tentativa de pushVal em coleção (${cleanPath}). Isso não é permitido pois destruiria a estrutura. Use setVal com uma subchave.`);
            return;
        }

        // FETCH current array
        const current = await getVal(cleanPath) || [];

        if (Array.isArray(current)) {
            current.push(value);
            await setVal(cleanPath, current);
        } else {
            // For one-off keys that aren't in collections but might contain arrays
            await setVal(cleanPath, [value]);
        }
    } catch (e) {
        console.error("Fatal Error pushVal", e);
    }
};

export const reloadDB = async () => {
    // Supabase is always fresh, no-op needed for compatibility
    return Promise.resolve();
};

export default { getVal, setVal, pushVal, reloadDB };
