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
exports.downloadFile = exports.uploadFile = void 0;
const supabase_1 = require("./supabase");
const BUCKET = 'books';
const uploadFile = (path_1, buffer_1, ...args_1) => __awaiter(void 0, [path_1, buffer_1, ...args_1], void 0, function* (path, buffer, contentType = 'application/octet-stream') {
    try {
        const { data, error } = yield supabase_1.supabase.storage
            .from(BUCKET)
            .upload(path, buffer, {
            contentType,
            upsert: true
        });
        if (error) {
            console.error(`Supabase Upload Error (${path}):`, error);
            return null;
        }
        const { data: publicData } = supabase_1.supabase.storage
            .from(BUCKET)
            .getPublicUrl(path);
        return publicData.publicUrl;
    }
    catch (e) {
        console.error("Storage Service Error:", e);
        return null;
    }
});
exports.uploadFile = uploadFile;
const downloadFile = (path) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Path might be a full URL, in which case we extracted the relative path?
        // Or assume it's the relative path in the bucket.
        // If it's a full URL, we might just fetch it.
        // For Supabase, download needs the path inside the bucket.
        // If 'path' starts with http, try to extract the key or just fetch it standardly?
        if (path.startsWith('http')) {
            const res = yield fetch(path);
            const blob = yield res.arrayBuffer();
            return Buffer.from(blob);
        }
        const { data, error } = yield supabase_1.supabase.storage
            .from(BUCKET)
            .download(path);
        if (error) {
            console.error(`Supabase Download Error (${path}):`, error);
            return null;
        }
        return Buffer.from(yield data.arrayBuffer());
    }
    catch (e) {
        console.error("Storage Download Error:", e);
        return null;
    }
});
exports.downloadFile = downloadFile;
