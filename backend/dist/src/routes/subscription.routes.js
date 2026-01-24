"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const router = (0, express_1.Router)();
router.post('/create', subscription_controller_1.SubscriptionController.create);
router.post('/change-plan', subscription_controller_1.SubscriptionController.changePlan);
router.post('/webhook', subscription_controller_1.SubscriptionController.webhook);
exports.default = router;
