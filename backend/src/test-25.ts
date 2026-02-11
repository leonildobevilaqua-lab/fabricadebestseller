
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
const key = process.env.GEMINI_API_KEY || "";
const client = new GoogleGenerativeAI(key);

async function run() {
    console.log("--- TESTANDO GEMINI 2.5 FLASH ---");
    console.log("Model requested: gemini-2.5-flash");
    try {
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("Respond 'OK 2.5' if you work.");
        console.log("Status: SUCCESS");
        console.log("Output: ", result.response.text());
    } catch (e: any) {
        console.log("Status: FAILED");
        console.log("Error: ", e.message);
    }

    console.log("\n--- TESTANDO FALLBACK (1.5 Flash) ---");
    try {
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Respond 'OK 1.5' if you work.");
        console.log("Status: SUCCESS");
        console.log("Output: ", result.response.text());
    } catch (e: any) {
        console.log("Status: FAILED");
        console.log("Error: ", e.message);
    }
}
run();
