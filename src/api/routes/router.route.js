import express from "express";

import { rateLimiter } from "../../middlewares/auth/security.middleware.js";
import { systemHealth } from "../controllers/auth/system.controller.js";

const router = express.Router();

router.get(
    "/health/",
    rateLimiter({
        limit: 20,
        window: 1,
        block: 2,
        route: "health"
    }),
    systemHealth
);

export default router;
