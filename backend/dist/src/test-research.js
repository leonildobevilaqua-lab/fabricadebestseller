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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ai_service_1 = require("./services/ai.service");
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
function testFlow() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("--- TEST FLOW START ---");
        const topic = "Como fazer amigos e influenciar pessoas";
        const start = Date.now();
        try {
            console.log("1. Testing YouTube Research...");
            const yt = yield (0, ai_service_1.researchYoutube)(topic);
            console.log(`[${Date.now() - start}ms] YT Result Length: ${yt.length}`);
            if (yt.length < 100)
                console.warn("WARNING: YT Result suspected empty/short");
            console.log("2. Testing Google Research...");
            const google = yield (0, ai_service_1.researchGoogle)(topic, yt);
            console.log(`[${Date.now() - start}ms] Google Result Length: ${google.length}`);
            console.log("3. Testing Competitors...");
            const comp = yield (0, ai_service_1.analyzeCompetitors)(topic, yt + "\n" + google);
            console.log(`[${Date.now() - start}ms] Comp Result Length: ${comp.length}`);
            console.log("4. Testing Titles...");
            const titles = yield (0, ai_service_1.generateTitleOptions)(topic, yt + "\n" + google + "\n" + comp);
            console.log(`[${Date.now() - start}ms] Titles Generated: ${titles.length}`);
            console.log(titles[0]);
        }
        catch (e) {
            console.error("FLOW FAILED:", e);
        }
    });
}
testFlow();
