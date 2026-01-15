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
    const data = await getVal('settings'); // maps to key='settings'
    if (!data) {
        await saveConfig(defaultConfig);
        return defaultConfig;
    }
    // Deep merge default with data to ensure new keys exist
    return { ...defaultConfig, ...data };
};

export const saveConfig = async (config: AppConfig) => {
    await setVal('settings', config);
};

export const updateConfig = async (updates: Partial<AppConfig>) => {
    const current = await getConfig();
    const next = { ...current, ...updates };
    await saveConfig(next);
    return next;
};
