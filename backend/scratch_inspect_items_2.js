const fs = require('fs');
const filepath = 'C:/Users/Pichau/.gemini/antigravity-ide/brain/3392c4ad-6700-4ca8-a831-4a8598ca1658/.system_generated/steps/94/output.txt';

const content = fs.readFileSync(filepath, 'utf8');
const match = content.match(/<untrusted-data-[^>]+>\s*(\[.*\])\s*<\/untrusted-data-/s);

if (match) {
    const data = JSON.parse(match[1]);
    console.log(`Parsed ${data.length} projects.`);
    
    data.forEach(item => {
        const val = item.value;
        const title = val?.title || val?.metadata?.title || val?.metadata?.bookTitle || val?.metadata?.theme || 'UNKNOWN';
        console.log(`\n--- Project ${item.key} ---`);
        console.log(`Title: ${title}`);
        console.log(`Status: ${val.status || val.metadata?.status}`);
        console.log(`Error: ${val.error || val.metadata?.error}`);
        console.log(`Kit: ${val.completeKitUrl || val.metadata?.completeKitUrl || 'NOT FOUND'}`);
        console.log(`PDF: ${val.pdfUrl || val.metadata?.pdfUrl || 'NOT FOUND'}`);
        console.log(`EPUB: ${val.epubUrl || val.metadata?.epubUrl || 'NOT FOUND'}`);
        console.log(`Has structure?`, !!val.structure || !!val.metadata?.structure);
        console.log(`Has generated structure items?`, !!(val.structure || val.metadata?.structure)?.some(s => s.isGenerated));
    });
} else {
    console.log("Could not parse JSON from file.");
}
