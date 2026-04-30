import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import {
    getCoupons,
    validateCoupon
} from "../controllers/user/payment/coupon.controller.js";

const router = express.Router();

router.use(
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 100,
        window: 2,
        block: 3,
        route: "payment:base"
    })
);

router.get("/coupons", getCoupons);
router.post("/coupon", validateCoupon);

export default router;
