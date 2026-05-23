const fetch = require('node-fetch');

(async () => {
    try {
        const query = `Pai Rico Pai Pobre Robert Kiyosaki`;
        const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
        console.log("Querying:", url);
        const res = await fetch(url);
        const data = await res.json();
        
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
