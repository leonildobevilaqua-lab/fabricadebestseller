import { search } from 'google-sr';
import * as YouTubeSearch from 'youtube-search-api';

interface SearchResult {
    title: string;
    description: string;
    link: string;
    source: string;
}

interface AmazonBook {
    title: string;
    snippet: string;
    link: string;
}

export const ResearchService = {

    /**
     * Realiza busca orgânica no Google simulando comportamento humano.
     * Busca por Dores, Mitos e Soluções.
     */
    async searchGoogle(query: string): Promise<SearchResult[]> {
        console.log(`[RESEARCH] Google Search: "${query}"`);
        try {
            const results = await search({
                query: query
            });

            // Verifica o formato retornado pelo google-sr (pode variar baseada na versão)
            // Geralmente é array de objetos com title, description, link
            if (!results || !Array.isArray(results)) return [];

            return results.slice(0, 10).map((r: any) => ({
                title: r.title || "No Title",
                description: r.description || r.snippet || "",
                link: r.link || "",
                source: "Google"
            }));
        } catch (error) {
            console.error("[RESEARCH] Google Search Failed:", error);
            return [];
        }
    },

    /**
     * Busca vídeos no YouTube para identificar o que o público está consumindo.
     */
    async searchYouTube(query: string): Promise<SearchResult[]> {
        console.log(`[RESEARCH] YouTube Search: "${query}"`);
        try {
            // Nota: youtube-search-api retorna { items: [...] }
            const data = await YouTubeSearch.GetListByKeyword(query, false, 10);

            if (!data || !data.items) return [];

            return data.items.map((item: any) => ({
                title: item.title || "",
                description: "YouTube Video - " + (item.length || ""), // Descrição nem sempre vem completa na lista
                link: `https://www.youtube.com/watch?v=${item.id}`,
                source: "YouTube"
            }));

        } catch (error) {
            console.error("[RESEARCH] YouTube Search Failed:", error);
            return [];
        }
    },

    /**
     * Busca específica na Amazon via Google Dorking para contornar bloqueios e falta de API.
     * Query: site:amazon.com.br "best sellers" [NICHO]
     */
    async searchAmazon(niche: string): Promise<AmazonBook[]> {
        const query = `site:amazon.com.br "passo a passo" OR "guia" ${niche}`;
        console.log(`[RESEARCH] Amazon Search via Google: "${query}"`);

        try {
            // Reutiliza a busca do Google com filtro de site
            const results = await search({
                query: query,
            });

            if (!results || !Array.isArray(results)) return [];

            return results.slice(0, 10).map((r: any) => ({
                title: r.title?.replace(" | Amazon.com.br", "") || "Livro Amazon",
                snippet: r.description || r.snippet || "",
                link: r.link || ""
            }));

        } catch (error) {
            console.error("[RESEARCH] Amazon/Google Search Failed:", error);
            return [];
        }
    }
};
