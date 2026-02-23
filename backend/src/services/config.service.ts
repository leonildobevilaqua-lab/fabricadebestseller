import { getVal, setVal } from './db.service';

const CONFIG_KEY = '/settings'; // Path in DB

export interface AppConfig {
    providers: {
        gemini: string;
        openai: string;
        anthropic: string;
        deepseek: string;
        llama: string;
    };
    activeProvider: 'gemini' | 'openai' | 'anthropic' | 'deepseek' | 'llama';
    admin: {
        user: string;
        pass: string;
    };
    email?: {
        host: string;
        port: number;
        user: string;
        pass: string;
    };
    products?: {
        english_book: string;
        spanish_book: string;
        cover_printed: string;
        cover_ebook: string;
        pub_amazon_printed: string;
        pub_amazon_digital: string;
        pub_uiclap: string;
        catalog_card: string;
        isbn_printed: string;
        isbn_digital: string;
        complete_package: string;
        sales_page: string;
        hosting: string;
    };
}

const defaultConfig: AppConfig = {
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

export const getConfig = async (): Promise<AppConfig> => {
    // Load fresh data mapped to user's database.json structure
    const settingsData = await getVal('/settings');
    const adminData = await getVal('/admin');

    // Base default
    let finalConfig = { ...defaultConfig };

    // Merge Settings (Providers, etc)
    if (settingsData) {
        finalConfig = { ...finalConfig, ...settingsData };
    }

    // Merge Admin (User/Pass) - Prioritize Root /admin key
    if (adminData) {
        finalConfig.admin = { ...finalConfig.admin, ...adminData };
    }

    // Ensure admin object exists even if partially merged
    if (!finalConfig.admin) finalConfig.admin = defaultConfig.admin;

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
    if (process.env.ANTHROPIC_API_KEY) finalConfig.providers.anthropic = process.env.ANTHROPIC_API_KEY;


    return finalConfig;
};

export const saveConfig = async (config: AppConfig) => {
    // Split config to match JSON structure: root admin, root settings
    const { admin, ...rest } = config;

    // ALLOW SAVE: Since we are running on VPS/Contabo (not Vercel), we want to persist keys to DB
    // even if they match ENV, so the Admin Panel reflects the truth.
    // Removed logic that cleared rest.providers.gemini/openai etc.

    // Save separately
    if (admin) await setVal('/admin', admin);
    await setVal('/settings', rest);
};

export const updateConfig = async (updates: Partial<AppConfig>) => {
    const current = await getConfig();
    const next = { ...current, ...updates };
    await saveConfig(next);
    return next;
};
