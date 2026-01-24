"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_auth_controller_1 = require("../controllers/user.auth.controller");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const SECRET = process.env.JWT_SECRET || "USER_SECRET_KEY_123";
// Middleware simples
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, SECRET, (err, user) => {
            if (err)
                return res.sendStatus(403);
            req.user = user;
            next();
        });
    }
    else {
        res.sendStatus(401);
    }
};
router.post('/login', user_auth_controller_1.UserAuthController.login);
router.post('/register', user_auth_controller_1.UserAuthController.register);
router.get('/me', authMiddleware, user_auth_controller_1.UserAuthController.me);
exports.default = router;
