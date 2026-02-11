
import OpenAI from "openai";
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function testOpenAI() {
    const key = process.env.OPENAI_API_KEY;
    console.log("Testing OpenAI Key:", key ? key.substring(0, 8) + "..." : "MISSING");

    if (!key) return;

    const client = new OpenAI({ apiKey: key });

    try {
        console.log("Sending request to gpt-4o...");
        const chatCompletion = await client.chat.completions.create({
            messages: [{ role: 'user', content: 'Say hello' }],
            model: 'gpt-4o',
        });
        console.log("Success gpt-4o:", chatCompletion.choices[0].message.content);
    } catch (e: any) {
        console.error("Failed gpt-4o:", e.message);

        try {
            console.log("Sending request to gpt-3.5-turbo...");
            const chatCompletion = await client.chat.completions.create({
                messages: [{ role: 'user', content: 'Say hello' }],
                model: 'gpt-3.5-turbo',
            });
            console.log("Success gpt-3.5-turbo:", chatCompletion.choices[0].message.content);
        } catch (e2: any) {
            console.error("Failed gpt-3.5-turbo:", e2.message);
        }
    }
}

testOpenAI();
