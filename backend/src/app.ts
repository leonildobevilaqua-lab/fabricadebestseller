
import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

app.use(cors());
app.options('*', cors()); // Enable Pre-Flight for ALL routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import purchaseRoutes from './routes/purchase.routes';
import cipRoutes from './routes/cip.routes';
import { handleKiwifyWebhook, handleTictoWebhook } from './controllers/payment.controller'; // Direct link for speed
import { SubscriptionController } from './controllers/subscription.controller';
import jwt from 'jsonwebtoken'; // Added for Golden Route
import userRoutes from './routes/user.routes';
import { createBookGenerationCharge } from './controllers/payment.controller'; // Emergency Import
import barcodeRoutes from './routes/barcode.routes';

const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";

// --- GOLDEN ROUTE (FAILSAFE LOGIN - DUAL PROTOCOL) ---
// Defined BEFORE routers to intercept login issues
// Supports POST (Standard) and GET (Emergency Bypass for 405 Errors)

const goldenLoginHandler = (req: express.Request, res: express.Response) => {
    try {
        // Support Body (POST) or Query (GET)
        const user = req.body?.user || req.query?.user;
        const pass = req.body?.pass || req.query?.pass;

        console.log(`[Golden Route] Login Attempt via ${req.method}: ${user}`);

        if (!user || !pass) return res.status(400).json({ error: "Missing credentials" });

        const cleanUser = String(user).trim().toLowerCase();
        const cleanPass = String(pass).trim();

        let valid = false;
        // User 1
        if (cleanUser === 'contato@leonildobevilaqua.com.br' && cleanPass === 'Leo129520-*-') valid = true;
        // User 2
        if (cleanUser === 'leonildobevilaqua@gmail.com' && cleanPass === 'Leo129520') valid = true;

        if (valid) {
            console.log(`[Golden Route] SUCCESS for ${cleanUser}`);
            // @ts-ignore
            const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }

        console.log(`[Golden Route] FAILED for ${cleanUser}`);
        return res.status(401).json({ error: "Invalid credentials (Auth v7.0 - Dual Protocol)" });
    } catch (e: any) {
        console.error("[Golden Route] Crash:", e);
        res.status(500).json({ error: "Golden Route Crash: " + e.message });
    }
};

app.options('/api/auth-master', cors());
app.post('/api/auth-master', goldenLoginHandler);
app.get('/api/admin-login-get', goldenLoginHandler); // GET Protocol

// EMERGENCY DIRECT ROUTE (Fixes 404 issue)
app.post('/api/purchase-direct', createBookGenerationCharge);

// Simple Health Check - VPS Production (Contabo/Coolify)
app.get('/api/auth-master-test', (req: express.Request, res: express.Response) => {
    res.json({ status: "Active", version: "v10.0-Stable", message: "VPS Backend (No-Proxy-Conflict)" });
});
app.get('/api/ping', (req, res) => res.status(200).json({ pong: true, time: new Date() }));
// --- WEBHOOK ENDPOINTS (PRIORITY - DUAL PROTOCOL - ALL METHODS) ---
// These are defined at root level to bypass any router conflicts or pre-processing issues.
// We use app.all to capture POST but also avoid 405 Method Not Allowed errors on probers.
app.all('/api/payment/webhook', handleKiwifyWebhook);
app.all('/api/payment/webhook/', handleKiwifyWebhook);
app.all('/api/payment/ticto-webhook', handleTictoWebhook);
app.all('/api/payment/ticto-webhook/', handleTictoWebhook);
app.all('/api/subscription/webhook', SubscriptionController.webhook);
app.all('/api/subscription/webhook/', SubscriptionController.webhook);
app.all('/webhook/asaas', SubscriptionController.webhook);
app.all('/asaas-webhook-direct', SubscriptionController.webhook); // NO PREFIX - BYPASS NGINX CONFLICTS
app.all('/webhook-test', (req, res) => res.json({ method: req.method, path: req.path, body: req.body }));

app.use('/api/projects', projectRoutes);
app.use('/api/cip', cipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/downloads', express.static(path.join(__dirname, '../generated_books')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
    res.send('Bestseller Factory API is Running on Port 3005. Go to frontend at http://localhost:3002');
});

export default app;