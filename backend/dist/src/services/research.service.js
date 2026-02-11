"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResearchService = void 0;
const google_sr_1 = require("google-sr");
const YouTubeSearch = __importStar(require("youtube-search-api"));
exports.ResearchService = {
    /**
     * Realiza busca orgânica no Google simulando comportamento humano.
     * Busca por Dores, Mitos e Soluções.
     */
    searchGoogle(query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[RESEARCH] Google Search: "${query}"`);
            try {
                const results = yield (0, google_sr_1.search)({
                    query: query
                });
                // Verifica o formato retornado pelo google-sr (pode variar baseada na versão)
                // Geralmente é array de objetos com title, description, link
                if (!results || !Array.isArray(results))
                    return [];
                return results.slice(0, 10).map((r) => ({
                    title: r.title || "No Title",
                    description: r.description || r.snippet || "",
                    link: r.link || "",
                    source: "Google"
                }));
            }
            catch (error) {
                console.error("[RESEARCH] Google Search Failed:", error);
                return [];
            }
        });
    },
    /**
     * Busca vídeos no YouTube para identificar o que o público está consumindo.
     */
    searchYouTube(query) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[RESEARCH] YouTube Search: "${query}"`);
            try {
                // Nota: youtube-search-api retorna { items: [...] }
                const data = yield YouTubeSearch.GetListByKeyword(query, false, 10);
                if (!data || !data.items)
                    return [];
                return data.items.map((item) => ({
                    title: item.title || "",
                    description: "YouTube Video - " + (item.length || ""), // Descrição nem sempre vem completa na lista
                    link: `https://www.youtube.com/watch?v=${item.id}`,
                    source: "YouTube"
                }));
            }
            catch (error) {
                console.error("[RESEARCH] YouTube Search Failed:", error);
                return [];
            }
        });
    },
    /**
     * Busca específica na Amazon via Google Dorking para contornar bloqueios e falta de API.
     * Query: site:amazon.com.br "best sellers" [NICHO]
     */
    searchAmazon(niche) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = `site:amazon.com.br "passo a passo" OR "guia" ${niche}`;
            console.log(`[RESEARCH] Amazon Search via Google: "${query}"`);
            try {
                // Reutiliza a busca do Google com filtro de site
                const results = yield (0, google_sr_1.search)({
                    query: query,
                });
                if (!results || !Array.isArray(results))
                    return [];
                return results.slice(0, 10).map((r) => {
                    var _a;
                    return ({
                        title: ((_a = r.title) === null || _a === void 0 ? void 0 : _a.replace(" | Amazon.com.br", "")) || "Livro Amazon",
                        snippet: r.description || r.snippet || "",
                        link: r.link || ""
                    });
                });
            }
            catch (error) {
                console.error("[RESEARCH] Amazon/Google Search Failed:", error);
                return [];
            }
        });
    }
};
