
import { Client, Databases, Storage, Account } from 'node-appwrite';

const client = new Client();

// Configurações serão preenchidas no Coolify amanhã
client
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://localhost/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);

export const APPWRITE_CONFIG = {
    databaseId: process.env.APPWRITE_DATABASE_ID || 'main',
    collectionId: process.env.APPWRITE_COLLECTION_ID || 'kv_store'
};
