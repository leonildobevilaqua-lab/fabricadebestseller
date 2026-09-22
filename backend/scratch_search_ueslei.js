const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const queries = ['ueslei', '77981047529', '02101326558', 'mensageirotop'];

const matches = [];

for (const key in db) {
    if (!key.startsWith('/projects/')) continue;
    
    const val = typeof db[key] === 'string' ? db[key] : JSON.stringify(db[key]);
    const strVal = val.toLowerCase();
    
    for (const q of queries) {
        if (strVal.includes(q)) {
            matches.push({
                key,
                match: q,
                data: typeof db[key] === 'string' ? JSON.parse(db[key]) : db[key]
            });
            break;
        }
    }
}

console.log(`Found ${matches.length} matching projects.`);
matches.forEach(m => {
    console.log(`Project: ${m.key} (matched by ${m.match})`);
    console.log(`Title: ${m.data.title || m.data.metadata?.title}`);
    console.log(`Email: ${m.data.customerEmail || m.data.metadata?.email || m.data.metadata?.contact?.email}`);
});
