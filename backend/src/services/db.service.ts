import { JsonDB, Config } from 'node-json-db';
import * as fs from 'fs';
import * as path from 'path';

// ENSURE DATA DIRECTORY EXISTS (Critical for Coolify/Docker Persistence)
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        console.log(`[DB] Created persistent data directory at: ${DATA_DIR}`);
    } catch (e) {
        console.error(`[DB] Failed to create data directory:`, e);
    }
}

// Database file will be at /app/data/database.json
const dbPath = path.join(DATA_DIR, 'database');
const db = new JsonDB(new Config(dbPath, true, false, '/'));

export const getVal = async (path: string) => {
    try {
        return await db.getData(path);
    } catch (e) {
        return null;
    }
};

export const setVal = async (path: string, value: any) => {
    await db.push(path, value);
};

export const pushVal = async (path: string, value: any) => {
    await db.push(path + "[]", value);
};

export const reloadDB = async () => {
    await db.reload();
};

export default { getVal, setVal, pushVal, reloadDB };
