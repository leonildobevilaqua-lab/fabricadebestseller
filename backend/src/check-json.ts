
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const key = process.env.GEMINI_API_KEY || "";
const client = new GoogleGenerativeAI(key);

async function run() {
    const result: any = { models: {} };
    const candidates = ["gemini-1.5-flash", "gemini-pro"];

    for (const m of candidates) {
        try {
            const model = client.getGenerativeModel({ model: m });
            await model.generateContent("Hi");
            result.models[m] = "OK";
        } catch (e: any) {
            result.models[m] = e.message;
        }
    }
    console.log("JSON_START");
    console.log(JSON.stringify(result));
    console.log("JSON_END");
}
run();
