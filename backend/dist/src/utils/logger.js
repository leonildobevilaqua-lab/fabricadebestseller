"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logError = (context, error) => {
    const logPath = path_1.default.resolve(__dirname, '../../debug_errors.log');
    const timestamp = new Date().toISOString();
    const msg = `[${timestamp}] [${context}] ${error.message || error}\nStack: ${error.stack || ''}\n\n`;
    fs_1.default.appendFileSync(logPath, msg);
};
exports.logError = logError;
