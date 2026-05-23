const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function scrapeAmazonDetails(query) {
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
        const $ = cheerio.load(html);
        
        // Target the first search result item
        const firstResult = $('div[data-component-type="s-search-result"]').first();
        
        const image = firstResult.find('.s-image').attr('src');
        
        // Find rating
        const ratingText = firstResult.find('.a-icon-star-small .a-icon-alt').text();
        
        // Find review count
        const reviewCount = firstResult.find('span[aria-label$="avaliações"]').text() || firstResult.find('span.a-size-base.s-underline-text').text();
        
        // Find "bought in past month" text
        const boughtText = firstResult.find('.a-size-base.a-color-secondary:contains("compras no mês passado")').text() || 
                           firstResult.find('.a-size-base.a-color-secondary:contains("comprado no mês passado")').text() ||
                           firstResult.find('span:contains("comprado no mês passado")').text();
                           
        return {
            image,
            rating: ratingText.trim(),
            reviews: reviewCount.trim(),
            bought: boughtText.trim()
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

(async () => {
    console.log(await scrapeAmazonDetails("O Poder do Agora Eckhart Tolle capa comum"));
    console.log(await scrapeAmazonDetails("A Alma Sem Amarras Michael A. Singer"));
    console.log(await scrapeAmazonDetails("Pai Rico Pai Pobre"));
})();
