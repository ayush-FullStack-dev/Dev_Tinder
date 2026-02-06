import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import { getCalls } from "../controllers/user/call/call.controller.js";

const router = express.Router();

router.use(
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 50,
        window: 2,
        block: 5,
        route: "call:base"
    })
);

router.get("/", getCalls);

export default router;
