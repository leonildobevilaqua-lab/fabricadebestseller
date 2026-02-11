
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const key = process.env.GEMINI_API_KEY || "";
const client = new GoogleGenerativeAI(key);

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-1.5-pro",
    "gemini-1.5-pro-latest",
    "gemini-1.0-pro",
    "gemini-pro"
];

async function check() {
    console.log("START_CHECK");
    for (const model of candidates) {
        try {
            const m = client.getGenerativeModel({ model });
            await m.generateContent("Hi");
            console.log(`SUCCESS: ${model}`);
            // Se achou um, pode parar ou listar todos. Vamos listar todos que funcionam.
        } catch (e: any) {
            console.log(`FAIL: ${model} - ${e.message.split(' ')[0]}...`);
        }
    }
    console.log("END_CHECK");
}
check();
