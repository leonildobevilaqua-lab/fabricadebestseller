const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const emails = {};
let noEmailCount = 0;

for (const key in db) {
    if (!key.startsWith('/projects/')) continue;
    
    const p = typeof db[key] === 'string' ? JSON.parse(db[key]) : db[key];
    if (!p) continue;
    
    const metadata = (p.metadata && typeof p.metadata === 'object') ? p.metadata : p;
    
    let email = p.customerEmail || metadata.email || metadata.contact?.email || metadata.userEmail;
    
    if (email) {
        email = email.toLowerCase().trim();
        emails[email] = (emails[email] || 0) + 1;
    } else {
        noEmailCount++;
    }
}

console.log(`Unique emails found: ${Object.keys(emails).length}`);
console.log(`Projects with NO email: ${noEmailCount}`);
console.log(emails);
