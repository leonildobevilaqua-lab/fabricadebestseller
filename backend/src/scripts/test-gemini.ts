
import dotenv from 'dotenv';
import path from 'path';
import { getVal } from '../services/db.service';
import { GeminiProvider } from '../services/llm/gemini.provider';

async function test() {
    console.log("Fetching config from DB...");
    const settings = await getVal('/settings');
    const key = settings?.providers?.gemini;
    
    if (!key) {
        console.error("No Gemini key found in /settings");
        return;
    }
    
    console.log("Testing Gemini Key (Starts with):", key.substring(0, 10));
    
    const provider = new GeminiProvider(key);
    try {
        console.log("Sending test prompt...");
        const response = await provider.generateText("Diga 'Olá Mundo' se você estiver funcionando.");
        console.log("Response:", response);
    } catch (e: any) {
        console.error("GEMINI TEST FAILED:", e.message);
        if (e.stack) console.error(e.stack);
    }
}

test();
