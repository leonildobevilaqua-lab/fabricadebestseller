import { supabase } from './supabase';

/**
 * DATABASE PERSISTENCE SERVICE (Supabase KV Mode)
 * Simplifiziert para compatibilidade Total com o sistema original.
 * Armazena cada caminho (ex: /leads, /projects) como um único documento JSON no Supabase.
 * Isso garante que toda a lógica de índices [0], push e splice funcione exatamente como antes.
 */

export const getVal = async (path: string): Promise<any> => {
    try {
        const cleanPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;

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

        // Se o path contém um índice como /leads[0], precisamos simular a alteração no array pai
        if (cleanPath.includes('[') && cleanPath.includes(']')) {
            const baseMatch = cleanPath.match(/^(.+?)\[(\d+)\]/);
            if (baseMatch) {
                const basePath = baseMatch[1];
                const index = parseInt(baseMatch[2]);
                const remainingPath = cleanPath.replace(baseMatch[0], ''); // Para casos como /leads[0]/status

                const parent = await getVal(basePath) || [];
                if (Array.isArray(parent)) {
                    if (remainingPath === '') {
                        parent[index] = value;
                    } else {
                        // Trata sub-chaves (ex: /leads[0]/status)
                        const subProp = remainingPath.replace(/^\//, '');
                        if (parent[index]) parent[index][subProp] = value;
                    }
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

        // FETCH atual do array
        const current = await getVal(cleanPath) || [];

        if (Array.isArray(current)) {
            current.push(value);
            await setVal(cleanPath, current);
        } else {
            // Se não for array, cria um novo array com o valor
            await setVal(cleanPath, [value]);
        }
    } catch (e) {
        console.error("Fatal Error pushVal", e);
    }
};

export const reloadDB = async () => {
    // No-op para compatibilidade
    return Promise.resolve();
};

export default { getVal, setVal, pushVal, reloadDB };
