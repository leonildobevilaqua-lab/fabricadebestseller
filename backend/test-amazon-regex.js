const fetch = require('node-fetch');

async function scrapeAmazonRegex(query) {
    try {
        const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });
        
        const html = await res.text();
        
        const ratingMatch = html.match(/([0-9,]+) de 5 estrelas/);
        const reviewMatch = html.match(/>([0-9.]+)<\/span><\/a> <span class="a-letter-space/);
        const boughtMatch = html.match(/([0-9.]+) compras no mês passado/i) || html.match(/Mais de ([0-9a-zA-Z]+) compras/i);
        
        return {
            rating: ratingMatch ? ratingMatch[1] : null,
            reviews: reviewMatch ? reviewMatch[1] : null,
            bought: boughtMatch ? boughtMatch[0] : null
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

(async () => {
    console.log(await scrapeAmazonRegex("O Poder do Agora Eckhart Tolle"));
    console.log(await scrapeAmazonRegex("Pai Rico Pai Pobre"));
})();
