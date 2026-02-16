import express from "express";
import {
    isLogin,
    findLoginData,
    validateBasicInfo
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";
import { checkPremiumStatus } from "../../middlewares/user/premium.middleware.js";

import { subscriptionPlans } from "../controllers/user/subscription/plans.controller.js";
import {
    validatePlan,
    validateCoupon,
    validateMethod,
    finalizeAmount,
    createOrder,
    sendPayment
} from "../controllers/user/subscription/checkout.controller.js";

import {
    validateBody,
    validateOrder,
    validateSigntaure
} from "../controllers/user/subscription/verifyPayment.controller.js";

const router = express.Router();

router.use(
	    /^((?!webhook).)*$/,
    isLogin,
    findLoginData,
    isProfileExists,
    checkPremiumStatus,
    rateLimiter({
        limit: 50,
        window: 2,
        block: 5,
        route: "subscription:base"
    })
);

router.get("/plans", subscriptionPlans);
router.post(
    "/checkout",
    validateBasicInfo,
    validatePlan,
    validateMethod,
    validateCoupon,
    finalizeAmount,
    createOrder,
    sendPayment
);

router.post("/webhook", validateBody, validateOrder, validateSigntaure);

export default router;
