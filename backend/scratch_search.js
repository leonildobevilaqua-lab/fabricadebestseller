const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

const query = 'mensageirotop'.toLowerCase();
console.log('Searching for:', query);

for (const key in db) {
    if (key.toLowerCase().includes(query)) {
        console.log(`Match in key: ${key}`);
    }
    const val = typeof db[key] === 'string' ? db[key] : JSON.stringify(db[key]);
    if (val && val.toLowerCase().includes(query)) {
        console.log(`Match in value of key: ${key}`);
    }
}
console.log('Search finished.');
