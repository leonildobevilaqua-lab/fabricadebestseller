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
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_service_1 = require("./config.service");
const sendEmail = (to, subject, text, attachments, html) => __awaiter(void 0, void 0, void 0, function* () {
    const config = yield (0, config_service_1.getConfig)();
    const settings = config.email;
    // Default or Config
    const host = (settings === null || settings === void 0 ? void 0 : settings.host) || process.env.SMTP_HOST;
    const port = (settings === null || settings === void 0 ? void 0 : settings.port) || process.env.SMTP_PORT || 587;
    const user = (settings === null || settings === void 0 ? void 0 : settings.user) || process.env.SMTP_USER;
    const pass = (settings === null || settings === void 0 ? void 0 : settings.pass) || process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        console.warn("SMTP settings not configured. Skipping email.");
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465, // true for 465, false for 587
        auth: {
            user,
            pass,
        },
        tls: {
            // Do not fail on invalid certs (common for cPanel/Shared Hosting)
            rejectUnauthorized: false
        }
    });
    try {
        const info = yield transporter.sendMail({
            from: `"Bestseller Factory" <${user}>`,
            to,
            subject,
            text,
            html,
            attachments
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
});
exports.sendEmail = sendEmail;
