const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

for (const key in db) {
    if (!key.startsWith('/projects/')) continue;
    
    const p = typeof db[key] === 'string' ? JSON.parse(db[key]) : db[key];
    if (!p) continue;
    
    const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
    
    let email = p.customerEmail || metadata.email || metadata.contact?.email || metadata.userEmail;
    
    if (!email) {
        const name = p.authorName || p.customerName || metadata.authorName || metadata.contact?.name || 'UNKNOWN';
        const title = p.title || p.bookTitle || metadata.title || metadata.bookTitle || 'UNKNOWN';
        console.log(`[NO EMAIL] ID: ${key} | Name: ${name} | Title: ${title}`);
    }
}
