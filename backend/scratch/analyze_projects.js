
const fs = require('fs');
const data = fs.readFileSync('database.json', 'utf8');
const obj = JSON.parse(data);
const keys = Object.keys(obj);
const projectKeys = keys.filter(k => k.startsWith('/projects/')).slice(0, 3);
projectKeys.forEach(k => {
    const item = obj[k];
    console.log(`Key: ${k}`);
    console.log(`Keys in object: ${Object.keys(item).join(', ')}`);
    if (item.metadata) {
        console.log(`Metadata keys: ${Object.keys(item.metadata).join(', ')}`);
        console.log(`Metadata bookTitle: ${item.metadata.bookTitle}`);
    }
    console.log(`Top-level bookTitle: ${item.bookTitle}`);
    console.log(`Top-level topic: ${item.topic}`);
    console.log('---');
});
