
import dotenv from 'dotenv';
import path from 'path';
import { GeminiProvider } from '../services/llm/gemini.provider';

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function testGemini() {
    console.log("--- Starting Gemini 2.5 Connectivity Test ---");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("ERROR: GEMINI_API_KEY not found in .env");
        process.exit(1);
    }
    console.log("API Key loaded (length):", apiKey.length);

    try {
        const provider = new GeminiProvider(apiKey);
        console.log("Provider instantiated. Testing 'generateText'...");

        const start = Date.now();
        const response = await provider.generateText("Hello! Are you Gemini 2.5? Please confirm your model version if possible or just say hello.");
        const duration = Date.now() - start;

        console.log("\n--- SUCCESS ---");
        console.log("Response Received in", duration, "ms");
        console.log("Response Content:\n", response);
        console.log("-----------------");

    } catch (error: any) {
        console.error("\n--- FAILURE ---");
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("API Response:", JSON.stringify(error.response, null, 2));
        }
        console.error("Full Trace:", error);
    }
}

testGemini();
