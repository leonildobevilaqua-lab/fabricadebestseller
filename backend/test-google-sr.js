const { search } = require('google-sr');

(async () => {
    try {
        console.log("Searching...");
        const results = await search({ query: 'site:amazon.com.br "mais vendidos" Espiritualidade' });
        console.log("Results:", results);
    } catch (e) {
        console.error("Error:", e);
    }
})();
