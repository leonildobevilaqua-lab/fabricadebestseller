import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/project.routes';
import adminRoutes from './routes/admin.routes';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

import paymentRoutes from './routes/payment.routes';

// ...
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
