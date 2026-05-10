const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const targetIds = ['0cfd1f55-0d60-4472-8b42-a19d7ea1ebe0', 'c6fed274-61ea-4e46-a2e6-fe6411b12e00'];
targetIds.forEach(id => {
  const key = `/projects/${id}`;
  console.log(`Key ${key}: ${db[key] ? 'FOUND' : 'NOT FOUND'}`);
  if (db[key]) {
      console.log(`Structure length: ${db[key].structure ? db[key].structure.length : 'N/A'}`);
      const missing = db[key].structure ? db[key].structure.filter(ch => !ch.isGenerated || !ch.content || ch.content.length < 100) : [];
      console.log(`Missing chapters: ${missing.length}`);
      if (missing.length > 0) {
          console.log(`Missing indices: ${missing.map(m => m.id).join(', ')}`);
      }
  }
});

