import express from "express";

// importing handlers
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
import { issueNewTokens } from "../controllers/auth/refresh.controller.js";
import { sendLogoutResponse } from "../controllers/auth/logout.controller.js";
import {
    sessionHandler,
    sessionRevokeHandler
} from "../controllers/auth/session.controller.js";
import {
    verifyIdentifyHandler,
    verifyVerifactionHandler
} from "../controllers/auth/auth.controller.js";
import { changePasswordHandler } from "../controllers/auth/password.controller.js";

// importing middleware
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
import {
    extractRefreshToken,
    validateRefreshToken,
    bindTokenToDevice,
    reEvaluateRisk,
    handleStepUpIfNeeded,
    rotateRefreshToken
} from "../../middlewares/auth/refreshValidation.js";
import {
    extractLogoutInfo,
    validateLogout,
    logoutAllSession,
    logoutCurrentSession
} from "../../middlewares/auth/logoutValidation.js";
import {
    isLogin,
    findLoginData,
    validateBasicInfo
} from "../../middlewares/auth/auth.middleware.js";
import { verifyVerifaction } from "../../middlewares/auth/verifyAuth.middleware.js";

const router = express.Router();

// Create new user
router.post("/signup/", signupValidation, signupHandler);
router.get("/verify/", verifyEvl);

// login to exting info
router.post(
    "/login/identify/",
    validateBasicInfo,
    loginIdentifyValidation,
    loginIdentifyHandler
);
router.post(
    "/login/confirm/",
    validateBasicInfo,
    verifyLoginValidation, // context + risk
    verifyLoginTrustDevice, // verylow auto-login
    verifyLoginPasskey, // low / mid
    verifyLoginPassword, // low / mid / high
    verifyLoginSessionApproval, // mid / high / veryhigh
    verifyLoginSecurityKey, // high / veryhigh
    verifyLoginHandler // final decision
);

// verify-2fa
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

// get new token
router.post(
    "/refresh/",
    validateBasicInfo,
    extractRefreshToken,
    validateRefreshToken,
    bindTokenToDevice,
    reEvaluateRisk,
    handleStepUpIfNeeded,
    rotateRefreshToken,
    issueNewTokens
);

// logout exsiting sessions
router.post(
    "/logout/",
    validateBasicInfo,
    extractLogoutInfo,
    validateLogout,
    logoutCurrentSession,
    sendLogoutResponse
);
router.post(
    "/logout-all/",
    validateBasicInfo,
    extractLogoutInfo,
    validateLogout,
    logoutAllSession,
    sendLogoutResponse
);

// see all active session & revoke it
router.get("/session/", isLogin, findLoginData, sessionHandler);
router.post(
    "/session/revoke/:id/",
    isLogin,
    findLoginData,
    sessionRevokeHandler
);

// password releted routes
router.post(
    "/change-password/start/",
    validateBasicInfo,
    isLogin,
    findLoginData,
    verifyIdentifyHandler
);

router.post(
    "/change-password/confirm/",
    validateBasicInfo,
    isLogin,
    findLoginData,
    verifyVerifaction,
    verifyLoginPasskey, // low / mid
    verifyLoginPassword, // low / mid / high
    verifyLoginSessionApproval, // mid / high / veryhigh
    verifyLoginSecurityKey, // high / veryhigh
    verifyVerifactionHandler, // final decision
    changePasswordHandler // chnage password
);

export default router;
