
import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

app.use(cors());
app.options('*', cors()); // Enable Pre-Flight for ALL routes
app.use(express.json());

import paymentRoutes from './routes/payment.routes';
import subscriptionRoutes from './routes/subscription.routes';
import purchaseRoutes from './routes/purchase.routes';
import jwt from 'jsonwebtoken'; // Added for Golden Route
import userRoutes from './routes/user.routes';
import { SubscriptionController } from './controllers/subscription.controller';
import { createBookGenerationCharge } from './controllers/payment.controller'; // Emergency Import

const SECRET_KEY = process.env.JWT_SECRET || "SUPER_SECRET_ADMIN_KEY_CHANGE_ME";

// ... (Golden Route omitted for brevity) ...

app.options('/api/auth-master', cors());
app.post('/api/auth-master', goldenLoginHandler);
app.get('/api/admin-login-get', goldenLoginHandler); // GET Protocol

// EMERGENCY DIRECT ROUTE (Fixes 404 issue)
app.post('/api/purchase-direct', createBookGenerationCharge);

// Simple Health Check
app.get('/api/auth-master-test', (req: express.Request, res: express.Response) => {
    res.json({ status: "Active", version: "v7.0", message: "Dual Protocol Active" });
});
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/purchase', purchaseRoutes); // REGISTER NEW ROUTE

// Alias for user's configured webhook
app.post('/webhook/asaas', SubscriptionController.webhook); // Direct mapping
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/user', userRoutes);
app.use('/downloads', express.static(path.join(__dirname, '../generated_books')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
    res.send('Bestseller Factory API is Running on Port 3001. Go to frontend at http://localhost:3002');
});

export default app;
