import nodemailer from 'nodemailer';
import { getConfig } from './config.service';

export const sendEmail = async (to: string, subject: string, text: string, attachments?: any[], html?: string) => {
    const config = await getConfig();
    const settings = config.email;

    // Default or Config
    const host = settings?.host || process.env.SMTP_HOST;
    const port = settings?.port || process.env.SMTP_PORT || 587;
    const user = settings?.user || process.env.SMTP_USER;
    const pass = settings?.pass || process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        console.warn("SMTP settings not configured. Skipping email.");
        return;
    }

    const transporter = nodemailer.createTransport({
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
        const info = await transporter.sendMail({
            from: `"Bestseller Factory" <${user}>`,
            to,
            subject,
            text,
            html,
            attachments
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};
