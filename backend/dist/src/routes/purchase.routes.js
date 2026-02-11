"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const purchase_controller_1 = require("../controllers/purchase.controller");
const router = (0, express_1.Router)();
router.post('/book-generation', purchase_controller_1.createBookCharge);
exports.default = router;
