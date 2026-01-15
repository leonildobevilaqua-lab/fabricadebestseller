
import { supabase } from './supabase';

const BUCKET = 'books';

export const uploadFile = async (path: string, buffer: Buffer, contentType: string = 'application/octet-stream'): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .upload(path, buffer, {
                contentType,
                upsert: true
            });

        if (error) {
            console.error(`Supabase Upload Error (${path}):`, error);
            return null;
        }

        const { data: publicData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);

        return publicData.publicUrl;
    } catch (e) {
        console.error("Storage Service Error:", e);
        return null;
    }
};

export const downloadFile = async (path: string): Promise<Buffer | null> => {
    try {
        // Path might be a full URL, in which case we extracted the relative path?
        // Or assume it's the relative path in the bucket.
        // If it's a full URL, we might just fetch it.
        // For Supabase, download needs the path inside the bucket.

        // If 'path' starts with http, try to extract the key or just fetch it standardly?
        if (path.startsWith('http')) {
            const res = await fetch(path);
            const blob = await res.arrayBuffer();
            return Buffer.from(blob);
        }

        const { data, error } = await supabase.storage
            .from(BUCKET)
            .download(path);

        if (error) {
            console.error(`Supabase Download Error (${path}):`, error);
            return null;
        }

        return Buffer.from(await data.arrayBuffer());
    } catch (e) {
        console.error("Storage Download Error:", e);
        return null;
    }
};
