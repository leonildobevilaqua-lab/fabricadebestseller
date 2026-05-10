const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const key = '/projects/c6fed274-61ea-4e46-a2e6-fe6411b12e00';
console.log(JSON.stringify(db[key], null, 2));
