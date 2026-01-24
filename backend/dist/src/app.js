"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.options('*', (0, cors_1.default)()); // Enable Pre-Flight for ALL routes
app.use(express_1.default.json());
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Added for Golden Route
const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";
// --- GOLDEN ROUTE (FAILSAFE LOGIN - DUAL PROTOCOL) ---
// Defined BEFORE routers to intercept login issues
// Supports POST (Standard) and GET (Emergency Bypass for 405 Errors)
const goldenLoginHandler = (req, res) => {
    var _a, _b, _c, _d;
    try {
        // Support Body (POST) or Query (GET)
        const user = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.user) || ((_b = req.query) === null || _b === void 0 ? void 0 : _b.user);
        const pass = ((_c = req.body) === null || _c === void 0 ? void 0 : _c.pass) || ((_d = req.query) === null || _d === void 0 ? void 0 : _d.pass);
        console.log(`[Golden Route] Login Attempt via ${req.method}: ${user}`);
        if (!user || !pass)
            return res.status(400).json({ error: "Missing credentials" });
        const cleanUser = String(user).trim().toLowerCase();
        const cleanPass = String(pass).trim();
        let valid = false;
        // User 1
        if (cleanUser === 'contato@leonildobevilaqua.com.br' && cleanPass === 'Leo129520-*-')
            valid = true;
        // User 2
        if (cleanUser === 'leonildobevilaqua@gmail.com' && cleanPass === 'Leo129520')
            valid = true;
        if (valid) {
            console.log(`[Golden Route] SUCCESS for ${cleanUser}`);
            // @ts-ignore
            const token = jsonwebtoken_1.default.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }
        console.log(`[Golden Route] FAILED for ${cleanUser}`);
        return res.status(401).json({ error: "Invalid credentials (Auth v7.0 - Dual Protocol)" });
    }
    catch (e) {
        console.error("[Golden Route] Crash:", e);
        res.status(500).json({ error: "Golden Route Crash: " + e.message });
    }
};
app.options('/api/auth-master', (0, cors_1.default)());
app.post('/api/auth-master', goldenLoginHandler);
app.get('/api/admin-login-get', goldenLoginHandler); // GET Protocol
// Simple Health Check
app.get('/api/auth-master-test', (req, res) => {
    res.json({ status: "Active", version: "v7.0", message: "Dual Protocol Active" });
});
app.use('/api/projects', project_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/payment', payment_routes_1.default);
// Alias for user's configured webhook
const subscription_controller_1 = require("./controllers/subscription.controller");
app.post('/webhook/asaas', subscription_controller_1.SubscriptionController.webhook); // Direct mapping
app.use('/api/subscription', subscription_routes_1.default);
const user_routes_1 = __importDefault(require("./routes/user.routes"));
app.use('/api/user', user_routes_1.default);
app.use('/downloads', express_1.default.static(path_1.default.join(__dirname, '../generated_books')));
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.get('/', (req, res) => {
    res.send('Bestseller Factory API is Running on Port 3001. Go to frontend at http://localhost:3002');
});
exports.default = app;
