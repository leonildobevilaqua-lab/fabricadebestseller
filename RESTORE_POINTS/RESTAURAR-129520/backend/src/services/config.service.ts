import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(__dirname, '../../settings.json');

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

export const getConfig = (): AppConfig => {
    if (!fs.existsSync(CONFIG_PATH)) {
        saveConfig(defaultConfig);
        return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
};

export const saveConfig = (config: AppConfig) => {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
};

export const updateConfig = (updates: Partial<AppConfig>) => {
    const current = getConfig();
    const next = { ...current, ...updates };
    saveConfig(next);
    return next;
};
