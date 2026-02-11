
import { researchYoutube, researchGoogle, analyzeCompetitors, generateTitleOptions } from './services/ai.service';
import * as dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function testFlow() {
    console.log("--- TEST FLOW START ---");
    const topic = "Como fazer amigos e influenciar pessoas";

    const start = Date.now();
    try {
        console.log("1. Testing YouTube Research...");
        const yt = await researchYoutube(topic);
        console.log(`[${Date.now() - start}ms] YT Result Length: ${yt.length}`);
        if (yt.length < 100) console.warn("WARNING: YT Result suspected empty/short");

        console.log("2. Testing Google Research...");
        const google = await researchGoogle(topic, yt);
        console.log(`[${Date.now() - start}ms] Google Result Length: ${google.length}`);

        console.log("3. Testing Competitors...");
        const comp = await analyzeCompetitors(topic, yt + "\n" + google);
        console.log(`[${Date.now() - start}ms] Comp Result Length: ${comp.length}`);

        console.log("4. Testing Titles...");
        const titles = await generateTitleOptions(topic, yt + "\n" + google + "\n" + comp);
        console.log(`[${Date.now() - start}ms] Titles Generated: ${titles.length}`);
        console.log(titles[0]);

    } catch (e: any) {
        console.error("FLOW FAILED:", e);
    }
}

testFlow();
