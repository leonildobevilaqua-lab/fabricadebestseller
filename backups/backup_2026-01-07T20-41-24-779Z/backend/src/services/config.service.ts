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
