import express from "express";

import {
    loginIdentifyHandler,
    verifyLoginHandler
} from "../controllers/auth/login.controller.js";
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
import { loginIdentifyValidation } from "../../middlewares/auth/loginValidation.js";
import { twoFAValidation } from "../../middlewares/auth/twoFAValidation.js";
import {
    verifyLoginValidation,
    verifyLoginTrustDevice,
    verifyLoginPasskey,
    verifyLoginPassword,
    verifyLoginSessionApproval,
    verifyLoginSecurityKey
} from "../../middlewares/auth/verifyLoginValidation.js";
import {
    verifyTwoFAValidation,
    verifyTwoFAEmail,
    verifyTwoFATotp,
    verifyTwoFABackupcode
} from "../../middlewares/auth/verifyTwoFAValidation.js";

const router = express.Router();

router.post("/signup", signupValidation, signupHandler);
router.get("/verify", verifyEvl);

router.post("/login/identify", loginIdentifyValidation, loginIdentifyHandler);
router.post(
    "/login/confirm",
    verifyLoginValidation,      // context + risk
    verifyLoginTrustDevice,     // verylow auto-login
    verifyLoginPasskey,         // low / mid
    verifyLoginPassword,        // low / mid / high
    verifyLoginSessionApproval,// mid / high / veryhigh
    verifyLoginSecurityKey,     // high / veryhigh
    verifyLoginHandler          // final decision
);

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
