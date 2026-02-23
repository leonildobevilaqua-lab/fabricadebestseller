"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateConfig = exports.saveConfig = exports.getConfig = void 0;
const db_service_1 = require("./db.service");
const CONFIG_KEY = '/settings'; // Path in DB
const defaultConfig = {
    providers: {
        gemini: "",
        openai: "",
        anthropic: "",
        deepseek: "",
        llama: ""
    },
    activeProvider: 'gemini',
    admin: {
        user: "contato@leonildobevilaqua.com.br",
        pass: "Leo129520-*-"
    },
    products: {
        english_book: "https://pay.kiwify.com.br/VqifT9S",
        spanish_book: "https://pay.kiwify.com.br/1Aj655e",
        cover_printed: "https://pay.kiwify.com.br/i45JRf1",
        cover_ebook: "https://pay.kiwify.com.br/NxPHXje",
        pub_amazon_printed: "https://pay.kiwify.com.br/QbQGtgm",
        pub_amazon_digital: "https://pay.kiwify.com.br/FOxvupC",
        pub_uiclap: "https://pay.kiwify.com.br/5MZbxZi",
        catalog_card: "https://pay.kiwify.com.br/hv6UVlU",
        isbn_printed: "https://pay.kiwify.com.br/rZdo3Jv",
        isbn_digital: "https://pay.kiwify.com.br/qoM41Tt",
        complete_package: "https://pay.kiwify.com.br/IHk1tZd",
        sales_page: "",
        hosting: ""
    }
};
// Cached config to reduce DB hits implies logic that might be stale on serverless.
// But we should fetch fresh on request if possible, or accept slight staleness.
// Since Config is rarely changed, efficient.
const getConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    // Load fresh data mapped to user's database.json structure
    const settingsData = yield (0, db_service_1.getVal)('/settings');
    const adminData = yield (0, db_service_1.getVal)('/admin');
    // Base default
    let finalConfig = Object.assign({}, defaultConfig);
    // Merge Settings (Providers, etc)
    if (settingsData) {
        finalConfig = Object.assign(Object.assign({}, finalConfig), settingsData);
    }
    // Merge Admin (User/Pass) - Prioritize Root /admin key
    if (adminData) {
        finalConfig.admin = Object.assign(Object.assign({}, finalConfig.admin), adminData);
    }
    // Ensure admin object exists even if partially merged
    if (!finalConfig.admin)
        finalConfig.admin = defaultConfig.admin;
    // --- HARD OVERRIDE VIA ENV VARS (Emergency Access) ---
    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASS) {
        // Only override if both are present to avoid partial breakage
        finalConfig.admin.user = process.env.ADMIN_EMAIL;
        finalConfig.admin.pass = process.env.ADMIN_PASS;
    }
    // --- LLM PROVIDER OVERRIDES VIA ENV (STRICT PRIORITY) ---
    // Specifically fix GEMINI to ignore DB old key if ENV is present
    const envGemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (envGemini && envGemini.length > 10) {
        finalConfig.providers.gemini = envGemini;
    }
    // Also protect OpenAI
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10) {
        finalConfig.providers.openai = process.env.OPENAI_API_KEY;
    }
    if (process.env.ANTHROPIC_API_KEY)
        finalConfig.providers.anthropic = process.env.ANTHROPIC_API_KEY;
    return finalConfig;
});
exports.getConfig = getConfig;
const saveConfig = (config) => __awaiter(void 0, void 0, void 0, function* () {
    // Split config to match JSON structure: root admin, root settings
    const { admin } = config, rest = __rest(config, ["admin"]);
    // ALLOW SAVE: Since we are running on VPS/Contabo (not Vercel), we want to persist keys to DB
    // even if they match ENV, so the Admin Panel reflects the truth.
    // Removed logic that cleared rest.providers.gemini/openai etc.
    // Save separately
    if (admin)
        yield (0, db_service_1.setVal)('/admin', admin);
    yield (0, db_service_1.setVal)('/settings', rest);
});
exports.saveConfig = saveConfig;
const updateConfig = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    const current = yield (0, exports.getConfig)();
    const next = Object.assign(Object.assign({}, current), updates);
    yield (0, exports.saveConfig)(next);
    return next;
});
exports.updateConfig = updateConfig;
