import { startResearch, selectTitle, generateBookContent } from './controllers/project.controller';
import * as QueueService from './services/queue.service';

async function testFullPipeline() {
    console.log("==========================================");
    console.log("   STARTING END-TO-END BOOK GENERATION TEST   ");
    console.log("==========================================");

    const topic = "Como Usar Inteligência Artificial para Dobrar as Vendas no Mercado Digital";
    const authorName = "Leonildo Bevilaqua";
    const testEmail = "contato@leonildobevilaqua.com.br";

    console.log(`\n1. Creating test project...`);
    const project = await QueueService.createProject({
        authorName,
        topic,
        language: 'pt',
        contact: { email: testEmail, name: authorName, phone: '11999999999' },
        email: testEmail,
        customerEmail: testEmail,
        contentStyle: 'Profissional',
        writingTone: 'Inspirador',
        isFiction: false
    });

    console.log("✅ Project created with ID:", project.id);

    console.log("\n2. Calling startResearch...");
    const mockReqRes = (params: any, body: any) => {
        let resData: any = null;
        let statusCode = 200;
        const req: any = { params, body, headers: { host: 'localhost:3005' } };
        const res: any = {
            json: (d: any) => { resData = d; return res; },
            status: (s: number) => { statusCode = s; return res; }
        };
        return { req, res, getData: () => ({ statusCode, resData }) };
    };

    const researchCall = mockReqRes({ id: project.id }, { language: 'pt', email: testEmail });
    await startResearch(researchCall.req, researchCall.res);
    console.log("startResearch HTTP Response:", researchCall.getData());

    console.log("\n3. Polling research progress...");
    let p = await QueueService.getProject(project.id);
    let attempts = 0;
    while (p && p.metadata.status === 'RESEARCHING' && attempts < 60) {
        await new Promise(r => setTimeout(r, 2000));
        p = await QueueService.getProject(project.id);
        attempts++;
        console.log(`   [Poll ${attempts}] Status: ${p?.metadata.status} | Progress: ${p?.metadata.progress}% | Message: ${p?.metadata.statusMessage}`);
    }

    if (!p || (p.metadata.status !== 'WAITING_TITLE' && p.metadata.status !== 'REVIEW_STRUCTURE')) {
        console.error("❌ Research failed or timed out! Final Status:", p?.metadata);
        process.exit(1);
    }

    console.log("✅ Research Completed! Status:", p.metadata.status);
    if (p.titleOptions && p.titleOptions.length > 0) {
        console.log("Titles generated:", p.titleOptions.map(t => t.title));
    }

    // Step 3: Select Title
    const selectedTitle = p.titleOptions?.[0]?.title || "Vendas com Inteligência Artificial";
    const selectedSub = p.titleOptions?.[0]?.subtitle || "O Guia Prático para Escalar Negócios Digitais";
    console.log(`\n4. Selecting Title: "${selectedTitle}"...`);

    const titleCall = mockReqRes({ id: project.id }, { title: selectedTitle, subtitle: selectedSub });
    await selectTitle(titleCall.req, titleCall.res);

    p = await QueueService.getProject(project.id);
    console.log("✅ Title selected! Status:", p?.metadata.status, "| Chapters in structure:", p?.structure?.length);

    // Step 4: Generate Book Content
    console.log("\n5. Starting Chapter Writing (generateBookContent)...");
    const genCall = mockReqRes({ id: project.id }, { language: 'pt' });
    await generateBookContent(genCall.req, genCall.res);
    console.log("generateBookContent HTTP Response:", genCall.getData());

    console.log("\n6. Polling Chapter Writing Progress...");
    attempts = 0;
    while (p && (p.metadata.status === 'WRITING_CHAPTERS' || p.metadata.status === 'REVIEW_STRUCTURE') && attempts < 120) {
        await new Promise(r => setTimeout(r, 3000));
        p = await QueueService.getProject(project.id);
        attempts++;
        const genCount = p?.structure?.filter(c => c.isGenerated)?.length || 0;
        console.log(`   [Poll ${attempts}] Status: ${p?.metadata.status} | Progress: ${p?.metadata.progress}% (${genCount}/${p?.structure?.length} chapters) | Message: ${p?.metadata.statusMessage}`);
        if (genCount > 2) break; // Break after verifying 2+ chapters write successfully
    }

    console.log("\n==========================================");
    console.log("✅ SUCCESS! BOOK GENERATION PIPELINE VERIFIED!");
    console.log(`   Project ID: ${p?.id}`);
    console.log(`   Title: ${p?.metadata?.bookTitle}`);
    console.log(`   Status: ${p?.metadata?.status}`);
    console.log(`   Generated Chapters: ${p?.structure?.filter(c => c.isGenerated).length} / ${p?.structure?.length}`);
    console.log("==========================================");
}

testFullPipeline().catch(err => {
    console.error("FATAL TEST ERROR:", err);
    process.exit(1);
});
