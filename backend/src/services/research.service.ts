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
     * Realiza busca orgânica no Google.
     * Para INGLÊS: usa geolocalização dos EUA (Google.com, região: United States).
     * Para PORTUGUÊS: busca normal no Google.com.br.
     */
    async searchGoogle(query: string, lang: string = 'pt'): Promise<SearchResult[]> {
        const isEnglish = lang === 'en';
        console.log(`[RESEARCH] Google Search (${lang}, market: ${isEnglish ? 'US' : 'BR'}): "${query}"`);
        try {
            const timeout = 60000; // 1 minute
            const searchPromise = search({
                query: query,
                // For English: target US region results (Google.com, United States)
                ...(isEnglish ? { gl: 'us', hl: 'en' } : {})
            } as any);

            const results = await Promise.race([
                searchPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Google Search Timeout")), timeout))
            ]) as any;

            if (!results || !Array.isArray(results)) return [];

            return results.slice(0, 10).map((r: any) => ({
                title: r.title || "No Title",
                description: r.description || r.snippet || "",
                link: r.link || "",
                source: isEnglish ? "Google.com (United States)" : "Google"
            }));
        } catch (error) {
            console.error("[RESEARCH] Google Search Failed:", error);
            return [];
        }
    },

    /**
     * Busca vídeos no YouTube.
     * Para INGLÊS: busca no YouTube.com com localização dos EUA.
     * Para PORTUGUÊS: busca padrão.
     */
    async searchYouTube(query: string, lang: string = 'pt'): Promise<SearchResult[]> {
        const isEnglish = lang === 'en';
        console.log(`[RESEARCH] YouTube Search (${lang}, market: ${isEnglish ? 'US' : 'BR'}): "${query}"`);
        try {
            // For English: add "english" to ensure US-market content
            const searchQuery = isEnglish ? `${query} english` : query;
            // youtube-search-api does not support regionCode in the same way, but we adjust the query
            const timeout = 60000; // 1 minute
            const searchPromise = YouTubeSearch.GetListByKeyword(searchQuery, false, 10);
            const data = await Promise.race([
                searchPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("YouTube Search Timeout")), timeout))
            ]) as any;

            if (!data || !data.items) return [];

            return data.items.map((item: any) => ({
                title: item.title || "",
                description: "YouTube Video - " + (item.length || ""),
                link: `https://www.youtube.com/watch?v=${item.id}`,
                source: isEnglish ? "YouTube.com (United States)" : "YouTube"
            }));

        } catch (error) {
            console.error("[RESEARCH] YouTube Search Failed:", error);
            return [];
        }
    },

    /**
     * Busca específica na Amazon via Google Dorking.
     * Para INGLÊS: usa Amazon.com (Global/EUA) — Top 10 Best Sellers — com termos em inglês.
     * Para PORTUGUÊS: usa Amazon.com.br com termos em português.
     */
    async searchAmazon(niche: string, lang: string = 'pt'): Promise<AmazonBook[]> {
        const isEnglish = lang === 'en';
        const domain = isEnglish ? 'amazon.com' : 'amazon.com.br';
        const guideTerm = isEnglish
            ? '"best sellers" OR "step by step" OR "guide" OR "how to"'
            : '"passo a passo" OR "guia" OR "mais vendidos"';
        const query = `site:${domain} ${guideTerm} ${niche}`;

        console.log(`[RESEARCH] Amazon Search via Google (lang=${lang}, domain=${domain}): "${query}"`);

        try {
            const timeout = 60000; // 1 minute
            const searchPromise = search({
                query: query,
                // For English: use US geolocation to get Amazon.com results
                ...(isEnglish ? { gl: 'us', hl: 'en' } : {})
            } as any);

            const results = await Promise.race([
                searchPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("Amazon Search Timeout")), timeout))
            ]) as any;

            if (!results || !Array.isArray(results)) return [];

            return results.slice(0, 10).map((r: any) => ({
                title: r.title?.replace(` | ${domain}`, "") || "Amazon Book",
                snippet: r.description || r.snippet || "",
                link: r.link || ""
            }));

        } catch (error) {
            console.error(`[RESEARCH] Amazon/Google Search (${lang} - ${domain}) Failed:`, error);
            return [];
        }
    }
};
