
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Explicitly use the NEW key provided by user just to be sure, although .env should have it.
const key = process.env.GEMINI_API_KEY;
console.log("Testing with key ending in:", key?.slice(-4));

const client = new GoogleGenerativeAI(key || "");

async function run() {
    console.log("--- TEST MAIN: gemini-2.5-flash ---");
    try {
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Hello 2.5");
        console.log("2.5 SUCCESS:", result.response.text());
    } catch (e: any) {
        console.log("2.5 FAILED:", e.message);
    }

    console.log("--- TEST BACKUP: gemini-1.5-flash ---");
    try {
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello 1.5");
        console.log("1.5 SUCCESS:", result.response.text());
    } catch (e: any) {
        console.log("1.5 FAILED:", e.message);
    }
}
run();
