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
import {
    changePasswordHandler,
    forgotPasswordHandler,
    resetPasswordValidation,
    resetPasswordHandler
} from "../controllers/auth/password.controller.js";
import {
    manageMfaHandler,
    enableTwoFA
} from "../controllers/auth/mfa/mfa.controller.js";
import {
    renewBackupCodeHandler,
    addBackupCodeHandler,
    activeBackupCodeHandler,
    deleteBackupCodeHandler
} from "../controllers/auth/mfa/backupcodes.controller.js";
import {
    activeTotpHandler,
    addTotpHandler,
    renewTotpHandler,
    deleteTotpHandler
} from "../controllers/auth/mfa/totp.controller.js";
import {
    activeMailsHandler,
    addNewMailHandler,
    verifyMailHandler,
    revokeMailHandler,
    resendOtpMfaHandler
} from "../controllers/auth/mfa/email.controller.js";
import { createSecurtyCode } from "../controllers/auth/securityCode.controller.js";
import {
    activePasskeysHandler,
    addNewPasskeyHandler,
    editPasskeyHandler,
    deletePasskeyHandler
} from "../controllers/auth/passkey.controller.js";
import {
    sessionApprovealHandler,
    sessionApprovealInfo
} from "../controllers/auth/sessionApproval.controller.js";
import {
    revokeTrustedDevice,
    getAllTrustedDevice
} from "../controllers/auth/trusted.controller.js";
import { securityEventHandler } from "../controllers/auth/account.controller.js";

// importing middleware
import { signupValidation } from "../../middlewares/auth/signup.middleware.js";
import { loginIdentifyValidation } from "../../middlewares/auth/login.middleware.js";
import { twoFAValidation } from "../../middlewares/auth/twoFA.middleware.js";
import {
    verifyLoginValidation,
    verifyLoginTrustDevice,
    verifyLoginPasskey,
    verifyLoginPassword,
    verifyLoginSessionApproval,
    verifyLoginSecurityCode
} from "../../middlewares/auth/verifyLogin.middleware.js";
import {
    verifyTwoFAValidation,
    verifyTwoFAEmail,
    verifyTwoFATotp,
    verifyTwoFABackupcode
} from "../../middlewares/auth/verifyTwoFA.middleware.js";
import {
    extractRefreshToken,
    validateRefreshToken,
    bindTokenToDevice,
    reEvaluateRisk,
    handleStepUpIfNeeded,
    rotateRefreshToken
} from "../../middlewares/auth/refresh.middleware.js";
import {
    extractLogoutInfo,
    validateLogout,
    logoutAllSession,
    logoutCurrentSession
} from "../../middlewares/auth/logout.middleware.js";
import {
    isLogin,
    findLoginData,
    validateBasicInfo
} from "../../middlewares/auth/auth.middleware.js";
import {
    verifyVerifaction,
    verifedMfaUser
} from "../../middlewares/auth/verifyAuth.middleware.js";

const router = express.Router();

// all route where need to authenticate
router.use(
    "/manage/",
    validateBasicInfo,
    isLogin,
    findLoginData,
    verifedMfaUser
);
router.use(
    "/mfa/manage/",
    validateBasicInfo,
    isLogin,
    findLoginData,
    verifedMfaUser
);
router.use("/account/", isLogin, findLoginData);

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
    verifyLoginPasskey, // low / mid // high
    verifyLoginPassword, // low / mid / high
    verifyLoginSessionApproval, // mid / high // veryhigh
    verifyLoginSecurityCode, // mid // high / veryhigh
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
    changePasswordHandler, // chnage password
    verifyLoginPasskey, // low / mid // high
    verifyLoginPassword, // low / mid / high
    verifyLoginSessionApproval, // mid / high / /veryhigh
    verifyLoginSecurityCode, // mid // high / veryhigh
    verifyVerifactionHandler("change:password", "submit_new_password") // check verified
);
router.post("/forgot-password/", forgotPasswordHandler);
router
    .route("/reset-password/:token/")
    .get(resetPasswordValidation)
    .post(resetPasswordHandler);

// twoFA releted routes
router.post("/mfa/start/", isLogin, findLoginData, verifyIdentifyHandler);

router.post(
    "/mfa/verify/",
    isLogin,
    findLoginData,
    verifyVerifaction,
    verifyLoginPasskey, // low / mid // high
    verifyLoginPassword, // low / mid / high
    verifyLoginSessionApproval, // mid / high / /veryhigh
    verifyLoginSecurityCode, // mid // high / veryhigh
    verifyVerifactionHandler("verify:mfa", "/mfa/manage?rpat=", {
        verified: true,
        expiresIn: Date.now() + 300000
    }) // check verified
);

router.route("/mfa/manage/").get(manageMfaHandler).post(enableTwoFA);

router
    .route("/mfa/manage/backupcode/")
    .get(activeBackupCodeHandler)
    .post(addBackupCodeHandler)
    .put(renewBackupCodeHandler)
    .delete(deleteBackupCodeHandler);

router
    .route("/mfa/manage/totp/")
    .get(activeTotpHandler)
    .post(addTotpHandler)
    .patch(renewTotpHandler)
    .delete(deleteTotpHandler);

router
    .route("/mfa/manage/email/")
    .get(activeMailsHandler)
    .post(addNewMailHandler)
    .delete(revokeMailHandler);

router.post("/mfa/manage/email/verify/", verifyMailHandler);
router.post("/mfa/manage/email/resend/", resendOtpMfaHandler);

// login methods

router.post("/manage/securitycode/", createSecurtyCode);
router
    .route("/manage/passkey/")
    .get(activePasskeysHandler)
    .post(addNewPasskeyHandler)
    .patch(editPasskeyHandler)
    .delete(deletePasskeyHandler);

router
    .route("/manage/trusted-devices/")
    .get(getAllTrustedDevice)
    .delete(revokeTrustedDevice);

router
    .route("/account/approve-login/:id")
    .get(sessionApprovealInfo)
    .post(sessionApprovealHandler);

router.get("/account/security-events/", securityEventHandler);

export default router;
