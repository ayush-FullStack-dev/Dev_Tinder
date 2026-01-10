import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import {
    isProfileExists,
    optionalProfile
} from "../../middlewares/user/profile.middleware.js";
import { optionalLogin } from "../../middlewares/auth/optional.middleware.js";

import { profileSetupHandler } from "../controllers/user/profile/setupProfile.controller.js";
import { loginProfileInfo } from "../controllers/user/profile/loginProfile.controller.js";
import {
    viewPublicProfile,
    getWhoViewdMe
} from "../controllers/user/profile/viewProfile.controller.js";

import {
    likePublicProfile,
    unlikePublicProfile
} from "../controllers/user/profile/likeProfile.controller.js";

const router = express.Router();

router.post("/setup", isLogin, findLoginData, profileSetupHandler);

router.get("/me", isLogin, findLoginData, isProfileExists, loginProfileInfo);
router.get("/views", isLogin, findLoginData, isProfileExists, getWhoViewdMe);

router.get(
    "/public/:username",
    optionalLogin,
    optionalProfile,
    viewPublicProfile
);
router
    .route("/public/:username/like")
    .post(isLogin, findLoginData, isProfileExists, likePublicProfile)
    .delete(isLogin, findLoginData, isProfileExists, unlikePublicProfile);

export default router;
