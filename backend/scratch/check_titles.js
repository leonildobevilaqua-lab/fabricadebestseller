
const fs = require('fs');
const data = fs.readFileSync('database.json', 'utf8');
const obj = JSON.parse(data);
const keys = Object.keys(obj);
const projectKeys = keys.filter(k => k.startsWith('/projects/')).slice(0, 3);
projectKeys.forEach(k => {
    const item = obj[k];
    console.log(`Key: ${k}`);
    console.log(`p.title: ${item.title}`);
    console.log(`p.bookTitle: ${item.bookTitle}`);
    console.log(`p.topic: ${item.topic}`);
    console.log('---');
});
