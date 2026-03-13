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
import { subscriptionHistory } from "../controllers/user/subscription/history.controller.js";

const router = express.Router();

router.get("/coupons", subscriptionPlans);


export default router;
