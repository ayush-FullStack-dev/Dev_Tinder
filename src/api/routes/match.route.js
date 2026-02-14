import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import {
    isPremiumUser,
    checkPremiumStatus
} from "../../middlewares/user/premium.middleware.js";

import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import {
    getMatched,
    getSpecificMatch
} from "../controllers/user/match/viewMatch.controller.js";
import {
    revokeMatch,
    deactivatedMatches,
    restoreMatch
} from "../controllers/user/match/deleteMatch.controller.js";

const router = express.Router();

router.use(
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 80,
        window: 2,
        block: 10,
        route: "match:base"
    }),
    checkPremiumStatus
);

router.get("/restore/", deactivatedMatches);

router.get(
    "/",
    rateLimiter({
        limit: 40,
        window: 2,
        block: 5,
        route: "match:list"
    }),
    getMatched
);

router
    .route("/:matchId")
    .get(
        rateLimiter({
            limit: 40,
            window: 2,
            block: 5,
            route: "match:detail"
        }),
        getSpecificMatch
    )
    .delete(
        rateLimiter({
            limit: 10,
            window: 10,
            block: 10,
            route: "match:revoke"
        }),
        revokeMatch
    );

router.post(
    "/restore/:matchId",
    rateLimiter({
        limit: 10,
        window: 10,
        block: 10,
        route: "match:restore"
    }),
    isPremiumUser(),
    restoreMatch
);

export default router;
