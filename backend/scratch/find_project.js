
const fs = require('fs');
const data = fs.readFileSync('database.json', 'utf8');
const obj = JSON.parse(data);
const keys = Object.keys(obj);
const projectKey = keys.find(k => k.startsWith('/projects/'));
if (projectKey) {
    console.log(JSON.stringify({ [projectKey]: obj[projectKey] }, null, 2));
} else {
    console.log("No /projects/ keys found");
}
