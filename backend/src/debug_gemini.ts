
import { getConfig } from "./services/config.service";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { reloadDB } from "./services/db.service";

async function testGemini() {
    console.log("Reloading DB...");
    await reloadDB();

    console.log("Fetching Config...");
    const config = await getConfig();
    const apiKey = config.providers.gemini;

    if (!apiKey) {
        console.error("ERROR: No Gemini Key Found in Config!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ["gemini-2.5-flash", "models/gemini-2.5-flash"];

    console.log(`Testing ${models.length} models with Key...`);

    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Test");
            const response = await result.response;
            console.log(`SUCCESS: ${m} - Response: ${response.text()}`);
        } catch (e: any) {
            console.log(`FAILED: ${m} - Status: ${e.status || 'Unknown'} - ${e.message?.slice(0, 100)}...`);
        }
    }
}

testGemini();
