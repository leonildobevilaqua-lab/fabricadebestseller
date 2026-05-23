const fetch = require('node-fetch');

(async () => {
    try {
        console.log("Calling API...");
        const response = await fetch('http://localhost:3005/api/projects/research-cover-market', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ niche: 'Espiritualidade' })
        });
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
})();
