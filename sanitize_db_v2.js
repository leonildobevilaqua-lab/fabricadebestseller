const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.json');

try {
    if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(raw);

        let modified = false;

        // Limpeza agressiva de chaves conhecidas
        const keys = ['gemini', 'openai', 'anthropic', 'google'];

        // Settings -> providers
        if (db.settings && db.settings.providers) {
            keys.forEach(k => {
                if (db.settings.providers[k]) { db.settings.providers[k] = ""; modified = true; }
            });
        }

        // Raiz -> providers
        if (db.providers) {
            keys.forEach(k => {
                if (db.providers[k]) { db.providers[k] = ""; modified = true; }
            });
        }

        // Varredura recursiva simples (chaves de API costumam ser longas, mas vamos focar nas conhecidas)
        // ...

        if (modified) {
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            console.log("Database sanitized successfully.");
        } else {
            console.log("Database was already clean.");
        }
    } else {
        console.log("Database file not found.");
    }
} catch (e) {
    console.error("Error sanitizing DB:", e);
}
