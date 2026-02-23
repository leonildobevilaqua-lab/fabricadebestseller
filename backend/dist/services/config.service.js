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
const getConfig = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, db_service_1.getVal)('settings'); // maps to key='settings'
    if (!data) {
        yield (0, exports.saveConfig)(defaultConfig);
        return defaultConfig;
    }
    // Deep merge default with data to ensure new keys exist
    return Object.assign(Object.assign({}, defaultConfig), data);
});
exports.getConfig = getConfig;
const saveConfig = (config) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, db_service_1.setVal)('settings', config);
});
exports.saveConfig = saveConfig;
const updateConfig = (updates) => __awaiter(void 0, void 0, void 0, function* () {
    const current = yield (0, exports.getConfig)();
    const next = Object.assign(Object.assign({}, current), updates);
    yield (0, exports.saveConfig)(next);
    return next;
});
exports.updateConfig = updateConfig;
