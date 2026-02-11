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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
function debugGemini() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const settingsPath = path_1.default.resolve(__dirname, '../settings.json');
        let key = '';
        try {
            const raw = fs_1.default.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(raw);
            key = (_a = settings.providers) === null || _a === void 0 ? void 0 : _a.gemini;
        }
        catch (e) {
            console.error("No settings");
            return;
        }
        console.log("Using Key ending in:", key.slice(-4));
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
            console.log(`Fetching models list from: ${url.replace(key, 'HIDDEN')}`);
            const res = yield axios_1.default.get(url);
            console.log("Status:", res.status);
            console.log("Available Models:");
            res.data.models.forEach((m) => {
                if (m.name.includes('gemini')) {
                    console.log(` - ${m.name} (${m.supportedGenerationMethods})`);
                }
            });
        }
        catch (e) {
            console.error("DEBUG FETCH FAILED:", (_b = e.response) === null || _b === void 0 ? void 0 : _b.status, (_c = e.response) === null || _c === void 0 ? void 0 : _c.data);
        }
    });
}
debugGemini();
