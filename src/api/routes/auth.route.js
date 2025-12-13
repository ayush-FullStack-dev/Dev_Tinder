import express from "express";

import { loginHandler } from "../controllers/auth/login.controller.js";
import {
    signupHandler,
    verifyEvl
} from "../controllers/auth/signup.controller.js";
import {
    startTwoFAHandler,
    verifyTwoFAHandler,
    resendOtpHandler
} from "../controllers/auth/twoFA.controller.js";


import { signupValidation } from "../../middlewares/auth/signupValidation.js";
import { loginValidation } from "../../middlewares/auth/loginValidation.js";
import { twoFAValidation } from "../../middlewares/auth/twoFAValidation.js";
import {
    verifyTwoFAValidation,
    verifyTwoFAEmail,
    verifyTwoFATotp,
    verifyTwoFABackupcode
} from "../../middlewares/auth/verifyTwoFAValidation.js";

const router = express.Router();

router.post("/signup", signupValidation, signupHandler);
router.get("/verify", verifyEvl);

router.post("/login", loginValidation, loginHandler);
router.post("/verify-2fa/start/", twoFAValidation, startTwoFAHandler);
router.post("/verify-2fa/resend/", twoFAValidation, resendOtpHandler);
router.post(
    "/verify-2fa/confirm/",
    verifyTwoFAValidation,
    verifyTwoFAEmail,
    verifyTwoFATotp,
    verifyTwoFABackupcode,
    verifyTwoFAHandler
);

export default router;
