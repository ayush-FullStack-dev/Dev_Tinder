import express from "express";
import {
    signupHandler,
    verifyEvl,
    loginHandler,
    startTwoFAHandler,
    verifyTwoFAHandler,
    resendOtpHandler
} from "../controllers/auth.js";
import {
    signupValidation,
    loginValidation,
    twoFAValidation,
    
    verifyTwoFAValidation,
    verifyTwoFAEmail,
    verifyTwoFATotp,
    verifyTwoFABackupcode
} from "../../middlewares/auth.js";

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

