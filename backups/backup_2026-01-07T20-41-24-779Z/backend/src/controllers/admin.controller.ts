import { Request, Response } from 'express';
import * as ConfigService from '../services/config.service';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "SUPER_SECRET_ADMIN_KEY_CHANGE_ME"; // In prod usage env

export const login = (req: Request, res: Response) => {
    const { user, pass } = req.body;
    const config = ConfigService.getConfig();

    if (user === config.admin.user && pass === config.admin.pass) {
        const token = jwt.sign({ user }, SECRET_KEY, { expiresIn: '2h' });
        return res.json({ token });
    }

    res.status(401).json({ error: "Invalid credentials" });
};

export const getSettings = (req: Request, res: Response) => {
    // Normally protect via middleware, simplified here
    const config = ConfigService.getConfig();
    // Don't reveal password in settings GET
    const safeConfig = { ...config, admin: { ...config.admin, pass: "***" } };
    res.json(safeConfig);
};

export const updateSettings = (req: Request, res: Response) => {
    const updates = req.body;
    // Prevent password overwrite unless specific flow
    if (updates.admin) delete updates.admin;

    const newConfig = ConfigService.updateConfig(updates);
    const safeConfig = { ...newConfig, admin: { ...newConfig.admin, pass: "***" } };
    res.json(safeConfig);
};
