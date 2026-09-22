const fs = require('fs');

const dbPath = './database.json';
const dbRaw = fs.readFileSync(dbPath, 'utf8');
const db = JSON.parse(dbRaw);

console.log('Credits:', db['/credits/mensageirotop_gmail_com']);
