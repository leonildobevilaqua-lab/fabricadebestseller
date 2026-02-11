import { JsonDB, Config } from 'node-json-db';

// Initialize DB
// save to 'db.json' in the root, sync on push
const db = new JsonDB(new Config("database", true, false, '/'));

export const getVal = async (path: string) => {
    try {
        return await db.getObject(path);
    } catch (e) {
        return null;
    }
};

export const setVal = async (path: string, value: any) => {
    await db.push(path, value);
};

export const pushVal = async (path: string, value: any) => {
    await db.push(path + "[]", value); // Add to array
};

export default db;
