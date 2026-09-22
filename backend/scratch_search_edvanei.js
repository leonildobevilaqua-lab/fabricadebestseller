const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const queries = ['edvanei', 'medina', 'astronomia'];

const matches = [];

for (const key in db) {
    if (!key.startsWith('/projects/')) continue;
    
    const val = typeof db[key] === 'string' ? db[key] : JSON.stringify(db[key]);
    const strVal = val.toLowerCase();
    
    for (const q of queries) {
        if (strVal.includes(q)) {
            let data = typeof db[key] === 'string' ? JSON.parse(db[key]) : db[key];
            const title = (data.title || data.metadata?.title || '').toLowerCase();
            const author = (data.authorName || data.metadata?.authorName || '').toLowerCase();
            
            // Need a bit more strict matching so it doesn't match a random book with the word 'astronomia'
            if (q === 'astronomia' && !title.includes('astronomia')) continue;
            if (q === 'medina' && !title.includes('medina')) continue;
            if (q === 'edvanei' && !author.includes('edvanei') && !strVal.includes('edvanei')) continue;
            
            matches.push({
                key,
                match: q,
                data: data
            });
            break;
        }
    }
}

console.log(`Found ${matches.length} matching projects.`);
matches.forEach(m => {
    console.log('--------------------------------------------------');
    console.log(`Project: ${m.key} (matched by ${m.match})`);
    console.log(`Title: ${m.data.title || m.data.metadata?.title}`);
    console.log(`Author: ${m.data.authorName || m.data.metadata?.authorName}`);
    console.log(`Email: ${m.data.customerEmail || m.data.metadata?.email || m.data.metadata?.contact?.email}`);
    console.log(`Status: ${m.data.status || m.data.metadata?.status}`);
    console.log(`Updated At: ${m.data.updatedAt || m.data.metadata?.updatedAt}`);
    console.log(`Has PDF? ${!!m.data.pdfUrl || !!m.data.metadata?.pdfUrl}`);
    console.log(`Has EPUB? ${!!m.data.epubUrl || !!m.data.metadata?.epubUrl}`);
    console.log(`Has Kit? ${!!m.data.completeKitUrl || !!m.data.metadata?.completeKitUrl}`);
    if (m.data.error || m.data.metadata?.error) {
        console.log(`Error: ${m.data.error || m.data.metadata?.error}`);
    }
});
