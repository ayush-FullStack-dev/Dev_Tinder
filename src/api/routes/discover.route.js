import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import {
    isProfileExists,
    isProfileBlocked
} from "../../middlewares/user/profile.middleware.js";
import { swipeProfile } from "../../middlewares/user/swipe.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import {
    getDiscover,
    getOldDiscover
} from "../controllers/user/discover/feed.controller.js";
import {
    leftSwipeProfile,
    rightSwipeProfile,
    rewindOldSwipe,
    getWhoRightSwipe
} from "../controllers/user/discover/swipe.controller.js";

const router = express.Router();

router.use(
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 50,
        window: 2,
        block: 5,
        route: "discover:base"
    })
);

router.get("/", getDiscover);
router.get("/old", getOldDiscover);

router.post(
    "/pass/:username",
    isProfileBlocked,
    swipeProfile,
    leftSwipeProfile
);

router.post(
    "/like/:username",
    isProfileBlocked,
    swipeProfile,
    rightSwipeProfile
);

router.get("/likes", getWhoRightSwipe);
router.post("/rewind/", rewindOldSwipe);
router.post("/boost/", rewindOldSwipe);

export default router;
