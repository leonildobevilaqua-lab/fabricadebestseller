const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const recentProjects = [];

for (const key in db) {
    if (!key.startsWith('/projects/')) continue;
    
    const p = typeof db[key] === 'string' ? JSON.parse(db[key]) : db[key];
    if (!p) continue;
    
    const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
    
    const dateStr = p.createdAt || metadata.createdAt || p.updated_at || metadata.date || p.date || p.created_at || metadata.created_at;
    if (dateStr) {
        const date = new Date(dateStr);
        if (date > new Date('2026-06-07')) {
            recentProjects.push({
                key,
                date: dateStr,
                email: p.customerEmail || metadata.email || metadata.contact?.email || 'NONE',
                name: metadata.authorName || p.authorName || metadata.contact?.name || 'NONE',
                title: p.title || metadata.title || p.bookTitle || metadata.bookTitle || 'NONE'
            });
        }
    }
}

recentProjects.sort((a, b) => new Date(b.date) - new Date(a.date));

console.log(`Found ${recentProjects.length} projects created since 2026-06-07.`);
recentProjects.slice(0, 20).forEach(p => {
    console.log(`${p.date} | ${p.name} | ${p.email} | ${p.title} | ${p.key}`);
});
