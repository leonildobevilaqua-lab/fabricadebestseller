const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function scrapeAmazonImage(query) {
    try {
        const url = `https://www.amazon.com.br/s?k=${encodeURIComponent(query)}`;
        console.log("Fetching:", url);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            }
        });
        
        const html = await res.text();
        // console.log("HTML length:", html.length);
        
        const $ = cheerio.load(html);
        // Amazon search result images often have class 's-image'
        const firstImage = $('.s-image').first().attr('src');
        
        return firstImage;
    } catch (e) {
        console.error(e);
        return null;
    }
}

(async () => {
    console.log(await scrapeAmazonImage("O Poder do Agora Eckhart Tolle capa comum"));
    console.log(await scrapeAmazonImage("A Alma Sem Amarras Michael A. Singer"));
})();
