import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import {
    isProfileExists,
    optionalProfile,
    isProfileBlocked
} from "../../middlewares/user/profile.middleware.js";
import { optionalLogin } from "../../middlewares/auth/optional.middleware.js";
import { checkPremiumStatus } from "../../middlewares/user/premium.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import { profileSetupHandler } from "../controllers/user/profile/setupProfile.controller.js";
import {
    loginProfileInfo,
    updateProfileInfo,
    changeProfileVisiblity,
    changeProfileIncognito,
    deleteProfile,
    restoreProfile,
    getProfileStats
} from "../controllers/user/profile/loginProfile.controller.js";
import {
    viewPublicProfile,
    getWhoViewdMe
} from "../controllers/user/profile/viewProfile.controller.js";
import {
    likePublicProfile,
    unlikePublicProfile,
    getWhoLikedProfile
} from "../controllers/user/profile/likeProfile.controller.js";
import {
    blockUser,
    unblockUser,
    blockedUser
} from "../controllers/user/profile/blockProfile.controller.js";
import {
    reportProfile,
    reportedProfiles
} from "../controllers/user/profile/reportProfile.controller.js";

const router = express.Router();

router.use(
    rateLimiter({
        limit: 120,
        window: 5,
        block: 5,
        route: "profile:base"
    })
);

router.post("/setup", isLogin, findLoginData, profileSetupHandler);

router
    .route("/me")
    .get(isLogin, findLoginData, isProfileExists, loginProfileInfo)
    .patch(isLogin, findLoginData, isProfileExists, updateProfileInfo)
    .delete(
        isLogin,
        findLoginData,
        isProfileExists,
        rateLimiter({
            limit: 3,
            window: 60,
            block: 30,
            route: "profile:delete"
        }),
        deleteProfile
    );

router.get(
    "/views",
    isLogin,
    findLoginData,
    isProfileExists,
    checkPremiumStatus,
    getWhoViewdMe
);

router.get(
    "/likes",
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 20,
        window: 5,
        block: 5,
        route: "profile:likes"
    }),
    checkPremiumStatus,
    getWhoLikedProfile
);

router.get("/stats", isLogin, findLoginData, isProfileExists, getProfileStats);

router.patch(
    "/visibility",
    isLogin,
    findLoginData,
    isProfileExists,
    changeProfileVisiblity
);

router.patch(
    "/incognito",
    isLogin,
    findLoginData,
    isProfileExists,
    checkPremiumStatus,
    changeProfileIncognito
);

router.post(
    "/restore",
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 3,
        window: 60,
        block: 30,
        route: "profile:restore"
    }),
    restoreProfile
);

router.get(
    "/public/:username",
    optionalLogin,
    optionalProfile,
    isProfileBlocked,
    viewPublicProfile
);

router
    .route("/public/:username/like")
    .post(
        isLogin,
        findLoginData,
        isProfileExists,
        isProfileBlocked,
        likePublicProfile
    )
    .delete(
        isLogin,
        findLoginData,
        isProfileExists,
        isProfileBlocked,
        unlikePublicProfile
    );

router.get("/block", isLogin, findLoginData, isProfileExists, blockedUser);

router
    .route("/block/:username")
    .post(
        isLogin,
        findLoginData,
        isProfileExists,
        rateLimiter({
            limit: 5,
            window: 5,
            block: 2,
            route: "profile:block"
        }),
        blockUser
    )
    .delete(
        isLogin,
        findLoginData,
        isProfileExists,
        rateLimiter({
            limit: 5,
            window: 5,
            block: 2,
            route: "profile:unblock"
        }),
        unblockUser
    );

router.post(
    "/report/:username",
    isLogin,
    findLoginData,
    isProfileExists,
    isProfileBlocked,
    rateLimiter({
        limit: 3,
        window: 5,
        block: 5,
        route: "profile:report"
    }),
    reportProfile
);

router.get(
    "/report/",
    isLogin,
    findLoginData,
    isProfileExists,
    reportedProfiles
);

export default router;
