import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

import paymentRoutes from './routes/payment.routes';
import jwt from 'jsonwebtoken'; // Added for Golden Route

const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";

// --- GOLDEN ROUTE (FAILSAFE LOGIN) ---
// Defined BEFORE routers to intercept /api/admin/login and prevent dependency crashes
// @ts-ignore
app.post('/api/admin/login', (req, res) => {
    try {
        const { user, pass } = req.body;
        console.log(`[Golden Route] Login Attempt: ${user}`);

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
            const token = jwt.sign({ user: cleanUser }, SECRET_KEY, { expiresIn: '24h' });
            return res.json({ token });
        }

        console.log(`[Golden Route] FAILED for ${cleanUser}`);
        return res.status(401).json({ error: "Invalid credentials (Auth v4.0 - Golden)" });
    } catch (e: any) {
        console.error("[Golden Route] Crash:", e);
        res.status(500).json({ error: "Golden Route Crash: " + e.message });
    }
});
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/downloads', express.static(path.join(__dirname, '../generated_books')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
    res.send('Bestseller Factory API is Running on Port 3001. Go to frontend at http://localhost:3002');
});

export default app;
