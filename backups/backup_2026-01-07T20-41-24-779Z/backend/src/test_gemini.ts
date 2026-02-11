import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import axios from 'axios';

async function debugGemini() {
    const settingsPath = path.resolve(__dirname, '../settings.json');

    let key = '';
    try {
        const raw = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(raw);
        key = settings.providers?.gemini;
    } catch (e) { console.error("No settings"); return; }

    console.log("Using Key ending in:", key.slice(-4));

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        console.log(`Fetching models list from: ${url.replace(key, 'HIDDEN')}`);

        const res = await axios.get(url);
        console.log("Status:", res.status);
        console.log("Available Models:");
        res.data.models.forEach((m: any) => {
            if (m.name.includes('gemini')) {
                console.log(` - ${m.name} (${m.supportedGenerationMethods})`);
            }
        });

    } catch (e: any) {
        console.error("DEBUG FETCH FAILED:", e.response?.status, e.response?.data);
    }
}

debugGemini();
