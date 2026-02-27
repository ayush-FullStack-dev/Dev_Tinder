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
    activateTrial,
    createAutopay
} from "../controllers/user/subscription/activate-trial.controller.js";
import { subscriptionHistory } from "../controllers/user/subscription/history.controller.js";
import {
    validateBody,
    validateOrder,
    validateSigntaure,
    handlePaymentCoupon,
    handlePaymentSuccess
} from "../controllers/user/subscription/webhook/cashfree/verifyPayment.controller.js";
import {
    handleAutoPayWebhook,
    handleAutoPaySuccess
} from "../controllers/user/subscription/webhook/cashfree/autoPay.controller.js";

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
router.get("/history", validateBasicInfo, subscriptionHistory);

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

router.post(
    "/activate-trial",
    validateBasicInfo,
    activateTrial,
    validateMethod,
    createAutopay,
    sendPayment
);

router.post(
    "/webhook/autopay",
    validateBody,
    validateSigntaure,
    handleAutoPayWebhook,
    handleAutoPaySuccess
);

router.post(
    "/webhook/payment",
    validateSigntaure,
    validateBody,
    validateOrder,
    handlePaymentCoupon,
    handlePaymentSuccess
);

export default router;
