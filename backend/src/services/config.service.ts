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
        english_book: "",
        spanish_book: "",
        cover_printed: "",
        cover_ebook: "",
        pub_amazon_printed: "",
        pub_amazon_digital: "",
        pub_uiclap: "",
        catalog_card: "",
        isbn_printed: "",
        isbn_digital: "",
        complete_package: "",
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

    // --- LLM PROVIDER OVERRIDES VIA ENV ---
    if (process.env.GEMINI_API_KEY) finalConfig.providers.gemini = process.env.GEMINI_API_KEY;
    if (process.env.OPENAI_API_KEY) finalConfig.providers.openai = process.env.OPENAI_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) finalConfig.providers.anthropic = process.env.ANTHROPIC_API_KEY;


    return finalConfig;
};

export const saveConfig = async (config: AppConfig) => {
    // Split config to match JSON structure: root admin, root settings
    const { admin, ...rest } = config;

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
