const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const email = 'mensageirotop@gmail.com';
const results = [];

const projects = db.projects || {};
for (const key in projects) {
    const p = projects[key];
    const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
    
    let customerEmail = (
        p.customerEmail || p.email || p.userEmail || 
        metadata.contact?.email || 
        metadata.email || 
        metadata.userEmail || 
        ""
    ).trim().toLowerCase();

    const strUser = String(email || '').toLowerCase().trim();
    
    if (customerEmail === strUser || JSON.stringify(p).toLowerCase().includes(strUser)) {
        results.push({
            id: p.id || metadata.id || p.projectId || key,
            title: metadata.bookTitle || p.bookTitle || metadata.title || p.title || metadata.topic || p.topic || 'Livro Gerado',
            customerEmail: customerEmail,
            hasContactEmail: !!metadata.contact?.email,
            status: p.status || metadata.status
        });
    }
}

console.log('Projects found for', email, ':', JSON.stringify(results, null, 2));

