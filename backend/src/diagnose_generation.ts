
import { getLLMProvider } from './services/llm.factory';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function diagnose() {
    console.log("--- DIAGNOSTIC START ---");

    try {
        const llm = await getLLMProvider();
        console.log("LLM Provider obtained:", llm.constructor.name);

        // Test Text Generation (Research)
        console.log("\n1. Testing Text Gen (Research Mock)...");
        try {
            const text = await llm.generateText("Explain quantum physics in 1 sentence.");
            console.log("✅ Text Gen Success:", text);
        } catch (e: any) {
            console.error("❌ Text Gen Failed:", e.message);
        }

        // Test JSON Generation (Titles)
        console.log("\n2. Testing JSON Gen (Titles Mock)...");
        const prompt = `
            Generate 3 book titles about "Time Travel".
            Return ONLY a JSON Array of objects: [{"title": "t", "subtitle": "s"}]
        `;
        try {
            const json = await llm.generateJSON(prompt);
            console.log("✅ JSON Gen Success:", JSON.stringify(json, null, 2));
        } catch (e: any) {
            console.error("❌ JSON Gen Failed:", e.message);
            console.error("Full Error:", e);
        }

    } catch (err: any) {
        console.error("FATAL SETUP ERROR:", err);
    }
}

diagnose();
