import crypto from "crypto";

import ApiError from "../../../helpers/ApiError.js";
import redis from "../../../config/redis.js";
import sendResponse from "../../../helpers/sendResponse.js";

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

import { fingerprintBuilder } from "../../../utils/fingerprint.js";
import { tokenBuilder } from "../../../utils/cron.js";

export const resendOtpHandler = async (req, res) => {
    const { email, ip, country, time } = req.auth;
    const ctxId = req.body.ctxId;

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

    const emailAllowed = user.twoFA.loginMethods.email.on;

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
    const ctxId = req.body.ctxId;
    const deviceInfo = {
        ...req.auth.deviceInfo,
        ip
    };

    const fingerprint = await fingerprintBuilder(req.auth.deviceInfo);

    if (!loginMethod) {
        throw new ApiError("BadRequest", "2Fa login method is undefined", 400);
    }

    const user = await findUser({
        email
    });

    if (!user) {
        return sendResponse(res, 401, { message: "User is not found" });
    }

    let isValid = await getSession(`2fa:data:${ctxId}`);

    if (isValid?.risk === "veryhigh") {
        sendSuspiciousAlert(user.email, deviceInfo);
    }

    if (isValid?.risk === "veryhigh" && loginMethod === "backupcode") {
        return sendResponse(res, 401, "Backup code not allowed for high risk");
    }

    if (!isValid?.verified) {
        return sendResponse(res, 401, {
            message: "2FA session expired or invalid. Please login again.",
            route: "/auth/login"
        });
    }

    await setSession(deviceInfo, ctxId, "device:info");
    await setSession(fingerprint, ctxId, "2fa:fp:start");

    const method = user.twoFA.loginMethods;
    if (loginMethod === "EMAIL" && method.email.on) {
        let message = "Trusted device detected. Completing secure sign-in…";
        let requireCode = false;
        const deviceTrust = await isDeviceTrusted({
            ctxId,
            trustedId: req.signedCookies.trustedDeviceId,
            fingerprint
        });

        if (!deviceTrust?.success) {
            const otp = await getOtpSetOtp(ctxId);
            const otpInfo = sendOtp(email, otp, deviceInfo);
            message = "Otp send Succesfull";
            requireCode = true;
        }

        await setSession(
            {
                start: true,
                method: "email"
            },
            ctxId
        );

        return sendResponse(res, 200, {
            message,
            route: "/auth/verify-2fa/confirm",
            requireCode
        });
    }

    if (loginMethod === "TOTP" && method.totp.on) {
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

    if (loginMethod === "BACKUPCODE" && method.backupcode.code.length) {
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
    return sendResponse(res, 401, { message: "Invalid 2fa login method " });
};

export const verifyTwoFAHandler = async (req, res) => {
    const { user, verify, userInfo, refreshExpiry, riskLevel, ctxId } =
        req.auth;

    if (riskLevel === "high" && !verify?.success) {
        sendSuspiciousAlert(user.email, req.auth.deviceInfo);
    }

    if (!verify?.success) {
        await cleanup2fa(ctxId);
        return sendResponse(res, 401, {
            message: verify?.message || "test"
        });
    }

    await cleanup2fa(ctxId);

    const checkDeviceTrusted = await setDeviceTrusted({
        trustDevice: req.body.trustDevice,
        rememberDevice: req.body.rememberDevice,
        ctxId,
        userInfo
    });

    const loginInfo = {
        name: user.name,
        ...req.auth.deviceInfo,
        deviceName: userInfo.deviceName
    };

    const accessToken = getAccesToken(user);

    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    userInfo.token = refreshToken;
    userInfo.loginContext = {
        twoFA: true,
        method: verify.method,
        risk: riskLevel
    };

    const tokenInfo = tokenBuilder(userInfo);

    user.refreshToken.push(tokenInfo);

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

    sendLoginAlert(user.email, loginInfo);

    res.status(200)
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
