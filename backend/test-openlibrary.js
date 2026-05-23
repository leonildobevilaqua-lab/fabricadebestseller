const fetch = require('node-fetch');

async function getBookCover(title, author) {
    try {
        const query = `${title} ${author}`;
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
        console.log("Querying:", url);
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.docs && data.docs.length > 0) {
            const coverId = data.docs[0].cover_i;
            if (coverId) {
                return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
            }
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

(async () => {
    const cover = await getBookCover("Pai Rico Pai Pobre", "Robert Kiyosaki");
    console.log("Cover URL:", cover);
})();
