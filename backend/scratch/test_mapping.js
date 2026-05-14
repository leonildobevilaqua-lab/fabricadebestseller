
const fs = require('fs');
const path = require('path');

// Mock getVal to use local database.json
const dbPath = path.resolve(__dirname, '../database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const getVal = (p) => {
    const cleanPath = p.startsWith('/') ? p : '/' + p;
    const normalized = cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath;
    const results = [];
    for (const [k, v] of Object.entries(db)) {
        if (k.startsWith(`${normalized}/`)) {
            results.push({ ...v, key: k });
        }
    }
    return results;
};

async function testMapping(email) {
    const strUser = email.toLowerCase().trim();
    
    // 1. Fetch
    const allProjects = getVal('/projects');
    const allLeads = getVal('/leads');
    
    // 2. Merge
    const combinedProjects = [...allProjects];
    allLeads.forEach(l => {
        const isBookLead = l.type === 'BOOK' || l.bookTitle || l.topic || l.projectId;
        const alreadyIn = combinedProjects.some(p => (p.id || p.projectId) === (l.id || l.projectId));
        if (isBookLead && !alreadyIn) {
            combinedProjects.push(l);
        }
    });
    
    // 3. Filter
    const userProjects = combinedProjects.filter(p => {
        const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
        const contact = metadata.contact || p.contact || {};
        const emails = [
            String(metadata.email || '').toLowerCase(),
            String(contact.email || '').toLowerCase(),
            String(p.email || '').toLowerCase()
        ];
        return emails.some(e => e.includes(strUser));
    });
    
    // 4. Map
    const mapped = userProjects.map(p => {
        const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
        const contact = metadata.contact || p.contact || {};
        const bookTitle = metadata.bookTitle || p.bookTitle || metadata.title || p.title || metadata.topic || p.topic || 'Livro Gerado';
        return {
            id: p.id || metadata.id || p.projectId,
            title: bookTitle,
            status: (metadata.status || p.status || 'PROCESSING').toUpperCase(),
            email: contact.email || p.email || metadata.email || '-'
        };
    });
    
    console.log(`Results for ${email}: ${mapped.length} projects`);
    mapped.slice(0, 5).forEach(m => console.log(` - [${m.status}] ${m.title} (${m.email})`));
}

testMapping('contato@leonildobevilaqua.com.br');
testMapping('coesuft@gmail.com'); // Example from earlier
