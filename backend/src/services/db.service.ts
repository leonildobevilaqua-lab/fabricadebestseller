import { JsonDB, Config } from 'node-json-db';

const db = new JsonDB(new Config("database", true, false, '/'));

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
