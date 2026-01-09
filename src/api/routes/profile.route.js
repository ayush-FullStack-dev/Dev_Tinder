import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";

import { profileSetupHandler } from "../controllers/user/profile/setupProfile.controller.js";
import { loginProfileInfo } from "../controllers/user/profile/loginProfile.controller.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";

const router = express.Router();

router.post("/setup", isLogin, findLoginData, profileSetupHandler);

router.get("/me", isLogin, findLoginData, isProfileExists, loginProfileInfo);

export default router;
