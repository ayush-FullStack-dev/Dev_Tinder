import crypto from "crypto";

import ApiError from "../../../helpers/ApiError.js";
import redis from "../../../config/redis.js";
import sendResponse, { clearCtxId } from "../../../helpers/sendResponse.js";

import { cookieOption } from "../../../constants/auth.constant.js";

import {
    sendOtp,
    sendSuspiciousAlert,
    sendLoginAlert
} from "../../../helpers/mail.js";
import { getRefreshToken, getAccesToken } from "../../../helpers/token.js";

import { findUser, updateUser } from "../../../services/user.service.js";
import {
    setDeviceTrusted,
    isDeviceTrusted
} from "../../../services/auth.service.js";
import {
    setSession,
    getSession,
    getOtpSetOtp,
    cleanup2fa
} from "../../../services/session.service.js";

import { getMaskedMails } from "../../../helpers/mail.js";

import { fingerprintBuilder } from "../../../utils/fingerprint.js";
import { tokenBuilder } from "../../../utils/cron.js";

export const resendOtpHandler = async (req, res) => {
    const { email, ip, country, time } = req.auth;
    const ctxId = req.signedCookies.twoFA_ctx;

    const user = await findUser({
        email
    });

    if (!user) {
        throw new ApiError("UnauthorizedError", "Invalid credentials!", 401);
    }

    let isValid = await getSession(`2fa:session:${ctxId}`);

    if (!isValid.start) {
        return sendResponse(res, 401, {
            message: "2fa session not fount first hit /start 2fa route"
        });
    }

    if (isValid.method !== "email") {
        return sendResponse(res, 401, {
            message: "otp is only allowed for other method"
        });
    }

    const emailAllowed = user.twoFA.twoFAMethods.email.enabled;

    if (!emailAllowed) {
        return sendResponse(res, 401, {
            message:
                "User is not allowed to login this account using email method"
        });
    }

    const deviceInfo = {
        browser: req.body.browser,
        os: req.body.os,
        ip,
        country,
        time
    };

    const otp = await getOtpSetOtp(ctxId);
    await sendOtp(email, otp, deviceInfo);
    return sendResponse(res, 200, {
        message: "Otp resend Succesfull",
        route: "/auth/verify-2fa/confirm"
    });
};

export const startTwoFAHandler = async (req, res) => {
    const { loginMethod, email, password, ip } = req.auth;
    const ctxId = req.signedCookies.twoFA_ctx;
    const deviceInfo = {
        ...req.auth.deviceInfo,
        ip
    };

    const fingerprint = await fingerprintBuilder(req.auth.deviceInfo);

    if (!loginMethod) {
        return sendResponse(res, 400, "2Fa login method is undefined");
    }

    const user = await findUser({
        email
    });

    if (!user) {
        return clearCtxId(res, 401, "user not found", "twoFA_ctx");
    }

    let isValid = await getSession(`2fa:data:${ctxId}`);

    if (isValid?.risk === "veryhigh") {
        sendSuspiciousAlert(user.email, deviceInfo);
    }

    if (isValid?.risk === "veryhigh" && loginMethod === "backupcode") {
        return clearCtxId(
            res,
            401,
            "Backup code not allowed for high risk",
            "twoFA_ctx"
        );
    }

    if (!isValid?.verified) {
        return clearCtxId(
            res,
            401,
            {
                message: "2FA session expired or invalid. Please login again.",
                route: "/auth/login"
            },
            "twoFA_ctx"
        );
    }

    await setSession(deviceInfo, ctxId, "device:info");
    await setSession(fingerprint, ctxId, "2fa:fp:start");

    const method = user.twoFA.twoFAMethods;
    if (loginMethod === "EMAIL" && method.email.enabled) {
        let message = "Trusted device detected. Completing secure sign-in…";
        let requireCode = false;
        const deviceTrust = await isDeviceTrusted({
            ctxId,
            trustedId: req.signedCookies.trustedDeviceId,
            fingerprint
        });

        if (!deviceTrust?.success) {
            const getData = await getSession(`otp:email:${ctxId}`);
            if (!getData) {
                const allowedEmail = getMaskedMails(method.email.emails);
                await setSession(
                    {
                        verified: true,
                        allowedEmail
                    },
                    ctxId,
                    "otp:email"
                );
                return sendResponse(res, 200, {
                    message:
                        "Select an email address to receive the verification code.",
                    allowedEmail,
                    next: "submit_email"
                });
            }

            if (!getData?.allowedEmail?.includes(req.body?.otpMail)) {
                return sendResponse(
                    res,
                    401,
                    "Selected email is not allowed for this verification."
                );
            }
            const otp = await getOtpSetOtp(ctxId);
            const otpInfo = sendOtp(req.body?.otpMail, otp, deviceInfo);
            message = "Otp send Succesfull";
            requireCode = true;
        }

        await setSession(
            {
                start: true,
                method: "email",
                email: req.body?.otpMail || false
            },
            ctxId
        );

        return sendResponse(res, 200, {
            message,
            route: "/auth/verify-2fa/confirm",
            requireCode
        });
    }

    if (loginMethod === "TOTP" && method.totp.enabled) {
        await setSession(
            {
                start: true,
                method: "totp"
            },
            ctxId
        );
        return sendResponse(res, 200, {
            message: "enter totp code",
            route: "/auth/verify-2fa/confirm",
            requireCode: true
        });
    }

    if (loginMethod === "BACKUPCODE" && method.backupCodes.enabled) {
        await setSession(
            {
                start: true,
                method: "backupcode"
            },
            ctxId
        );
        return sendResponse(res, 200, {
            message: "enter backup code",
            route: "/auth/verify-2fa/confirm",
            requireCode: true
        });
    }

    await setSession(
        {
            start: false,
            method: "none"
        },
        ctxId
    );
    return clearCtxId(res, 401, "Invalid 2fa login method", "twoFA_ctx");
};

export const verifyTwoFAHandler = async (req, res) => {
    const { user, verify, userInfo, refreshExpiry, riskLevel, ctxId } =
        req.auth;

    if (riskLevel === "high" && !verify?.success) {
        sendSuspiciousAlert(user.email, req.auth.deviceInfo);
    }

    if (!verify?.success) {
        await cleanup2fa(ctxId);
        return clearCtxId(res, 401, verify?.message, "twoFA_ctx");
    }

    await cleanup2fa(ctxId);

    const checkDeviceTrusted = await setDeviceTrusted({
        trustDevice: req.body.trustDevice,
        rememberDevice: req.body.rememberDevice,
        ctxId,
        userInfo
    });

    const accessToken = getAccesToken(user);

    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    const tokenInfo = user.refreshToken.find(k => k.ctxId.equals(ctxId));

    user.refreshToken = user.refreshToken.filter(k => !k.ctxId.equals(ctxId));

    tokenInfo.fingerprint = await fingerprintBuilder(tokenInfo);
    tokenInfo.token = refreshToken;
    tokenInfo.loginContext.mfa = {
        required: true,
        complete: true,
        methodsUsed: verify.method
    };

    user.refreshToken.push(tokenBuilder(tokenInfo));

    if (user.refreshToken.length > process.env.ALLOWED_TOKEN) {
        user.refreshToken.shift();
    }

    const updatedUser = await updateUser(
        user._id,
        {
            refreshToken: user.refreshToken
        },
        {
            id: true
        }
    );

    sendLoginAlert(user.email, {
        name: user.name,
        ...req.auth.deviceInfo,
        deviceName: userInfo.deviceName
    });

    res.status(200)
        .clearCookie("twoFA_ctx", cookieOption)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .cookie("trustedDeviceId", checkDeviceTrusted?.trustedId, cookieOption)
        .json({
            success: true,
            message: "User login successfully",
            data: {
                name: updatedUser.name,
                email: updatedUser.email,
                picture: updatedUser.picture
            }
        });
};
