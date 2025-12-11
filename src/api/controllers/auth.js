import crypto from "crypto";
import epochify from "epochify";
import geoip from "geoip-lite";

import ApiError from "../../helpers/ApiError.js";
import redis from "../../config/redis.js";

import {
    sendResponse,
    getAccesToken,
    getRefreshToken
} from "../../helpers/helpers.js";

import {
    findUser,
    createUser,
    updateUser,
    findPendingUser,
    createPendingUser,
    deletePendingUser
} from "../services/auth.js";

import {
    fingerprintBuilder,
    compareFingerprint
} from "../../helpers/fingerprint.js";

import {
    tokenBuilder,
    cleanup2fa,
    getRiskScore,
    getRiskLevel
} from "../../utils/cron.js";
import {
    sendVerifyLink,
    sendOtp,
    sendSuspiciousAlert,
    sendLoginAlert
} from "../../helpers/mail.js";
import { generateHash, verifyHash } from "../../helpers/hash.js";
import { getOtpSetOtp, setSession } from "../services/service.js";

const cookieOption = {
    httpOnly: true,
    signed: true,
    secure: true
};

const validatePass = async (password, hashPass) => {
    return await verifyHash(password, hashPass);
};

export const signupHandler = async (req, res) => {
    let { name, email, username, password, gender, role } = req.body;
    const verificationToken = crypto
        .randomBytes(Number(process.env.BYTE))
        .toString("hex");
    password = await generateHash(password);
    const userData = await createPendingUser({
        name,
        email,
        username,
        password,
        role,
        gender,
        token: verificationToken,
        expireAt: Date.now()
    });
    const sendEvl = await sendVerifyLink(email, verificationToken);
    return sendResponse(res, 200, {
        message: "Verification Link Send Succesfull",
        data: {
            name: userData.name,
            email: userData.email,
            username: userData.username
        }
    });
};

export const verifyEvl = async (req, res) => {
    const token = req.query.token;
    if (!token) {
        throw new ApiError("BadRequest", " Token is not found in query", 400);
    }
    if (token.length !== Number(process.env.BYTE) * 2) {
        throw new ApiError("BadRequest", " Token is invalid or corrupted", 400);
    }
    const findData = await findPendingUser({
        token
    });
    if (!findData) {
        throw new ApiError(
            "UnauthorizedError",
            "Verify Token is invalid or expired",
            401
        );
    }
    const diff = epochify.getDiff(Date.now(), findData.expireAt, "minutes");

    if (diff > 15) {
        await deletePendingUser(findData._id, {
            id: true
        });
        return sendResponse(res, 410, {
            message: "Verify Token is expired!"
        });
    }

    const userData = await createUser({
        name: findData.name,
        email: findData.email,
        username: findData.username,
        password: findData.password,
        role: findData.role,
        gender: findData.gender
    });

    await deletePendingUser(findData._id, {
        id: true
    });

    return sendResponse(res, 201, {
        message: "user created successfull",
        data: {
            name: userData.name,
            email: userData.email,
            username: userData.username,
            picture: userData.picture
        }
    });
};

export const loginHandler = async (req, res) => {
    const { login, refreshExpiry, fieldName, password, time } = req.auth;
    let score = 0;
    let twoFaOn = false;
    let riskLevel = "low";
    const message = "Invalid credentials!";
    const userInfo = {
        ...req.auth.deviceInfo
    };

    const user = await findUser({
        [fieldName]: login
    });

    if (!user) {
        return sendResponse(res, 401, {
            message
        });
    }

    if (!(await validatePass(password, user.password))) {
        return sendResponse(res, 401, {
            message
        });
    }

    const methods = [];

    for (const key in user.twoFA.loginMethods) {
        const method = user.twoFA.loginMethods[key];
        if (method.on) {
            methods.push(method.type);
        }
    }

    if (user.refreshToken.length) {
        const lastSession = user.refreshToken[user.refreshToken.length - 1];
        score = await getRiskScore(userInfo, lastSession, { time });
        console.log(score);
    }

    if (user.twoFA.enabled) {
        twoFaOn = true;
        if (score >= 85) {
            riskLevel = "veryhigh";
        } else {
            riskLevel = "mid";
        }
    } else {
        riskLevel = getRiskLevel(score);
    }

    const accesToken = getAccesToken(user);

    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    userInfo.fingerprint = await fingerprintBuilder(userInfo);
    userInfo.token = refreshToken;

    const tokenInfo = tokenBuilder(userInfo);

    if (riskLevel === "veryhigh" && !twoFaOn) {
        sendSuspiciousAlert(user.email, deviceInfo);
        return sendResponse(
            res,
            401,
            "You blocked a suspicious sign-in attempt."
        );
    }

    if (riskLevel !== "verylow" && riskLevel !== "low") {
        const setUser = await setSession(
            {
                verified: true,
                risk: riskLevel
            },
            user.email
        );
        return sendResponse(res, 401, {
            message: "2FA required",
            methods,
            route: "/auth/verify-2fa/start/"
        });
    }

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

    res.status(200)
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
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

// suspicious route Handler
export const startTwoFAHandler = async (req, res) => {
    const { loginMethod, email, password, ip } = req.auth;
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

    let getRisk = await redis.get(`2fa:session:${user.email}`);
    getRisk = JSON.parse(getRisk);

    if (getRisk.risk === "veryhigh") {
        await sendSuspiciousAlert(user.email, userInfo);
    }

    if (getRisk.risk === "veryhigh" && loginMethod === "backupcode") {
        return sendResponse(res, 401, "Backup code not allowed for high risk");
    }

    let isValid = await redis.get(`2fa:session:${user.email}`);
    isValid = JSON.parse(isValid);

    if (!isValid?.verified) {
        return sendResponse(res, 401, {
            message: "2FA session expired or invalid. Please login again.",
            route: "/auth/login"
        });
    }

    await setSession(deviceInfo, user, "device:info");
    await setSession(fingerprint, user, "2fa:fp:start");

    const method = user.twoFA.loginMethods;
    if (loginMethod === "EMAIL" && method.email.on) {
        const otp = await getOtpSetOtp(user);
        const otpInfo = sendOtp(email, otp, deviceInfo);
        await setSession(
            {
                start: true,
                method: "email"
            },
            user
        );
        return sendResponse(res, 200, {
            message: "Otp send Succesfull",
            route: "/auth/verify-2fa/confirm"
        });
    }

    if (loginMethod === "TOTP" && method.totp.on) {
        await setSession(
            {
                start: true,
                method: "totp"
            },
            user
        );
        return sendResponse(res, 200, {
            message: "enter totp code",
            route: "/auth/verify-2fa/confirm"
        });
    }

    if (loginMethod === "BACKUPCODE" && method.backupcode.code.length) {
        await setSession(
            {
                start: true,
                method: "backupcode"
            },
            user
        );
        return sendResponse(res, 200, {
            message: "enter backup code",
            route: "/auth/verify-2fa/confirm"
        });
    }

    await setSession(
        {
            start: false,
            method: "none"
        },
        user
    );
    return sendResponse(res, 401, { message: "Invalid 2fa login method " });
};

export const resendOtpHandler = async (req, res) => {
    const { email, ip, country, time } = req.auth;

    const user = await findUser({
        email
    });

    if (!user) {
        throw new ApiError("UnauthorizedError", "Invalid credentials!", 401);
    }

    let isValid = await redis.get(`2fa:session:${user._id}`);
    isValid = JSON.parse(isValid);

    if (!isValid.start) {
        return sendResponse(res, 401, {
            message: "2fa session not fount first start 2fa service"
        });
    }

    if (isValid.method !== "email") {
        return sendResponse(res, 401, {
            message: "otp is only allowed for email"
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

    const otp = await getOtpSetOtp(user);
    await sendOtp(email, otp, deviceInfo);
    return sendResponse(res, 200, {
        message: "Otp resend Succesfull",
        route: "/auth/verify-2fa/confirm"
    });
};

export const verifyTwoFAHandler = async (req, res) => {
    const { user, verify, userInfo, refreshExpiry, riskLevel } = req.auth;
    const deviceInfo = {
        ...req.auth.deviceInfo
    };
    let trustedId = null;

    if (riskLevel === "high" && !verify?.success) {
        sendSuspiciousAlert(user.email, deviceInfo);
    }

    if (!verify?.success) {
        await cleanup2fa(user);
        return sendResponse(res, 401, {
            message: verify?.message || "test"
        });
    }

    await cleanup2fa(user);

    if (req.body.trustDevice) {
        trustedId = crypto.randomBytes(16).toString("hex");
        await redis.set(
            `trustedDevice:${trustedId}`,
            userInfo,
            "PX",
            userInfo.expiresAt
        );
    }

    if (req.body.remeberDevice) {
        await redis.set(
            `trusted:${user._id}:${userInfo.fingerprintHash}`,
            true,
            "EX",
            60 * 60 * 24 * 30
        );
    }

    const loginInfo = {
        name: user.name,
        ...req.auth.deviceInfo,
        deviceName: userInfo.deviceName
    };

    const accesToken = getAccesToken(user);

    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    userInfo.token = refreshToken;

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
        .cookie("accesToken", accesToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .cookie("trustedDeviceId", trustedId, cookieOption)
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

// cleanup function
const cleanupDbId = setInterval(
    async () => {
        try {
            const future = new Date();
            future.setMinutes(future.getMinutes() + 15);
            const currentTimeStamp = future.getTime();
            const user = await deletePendingUser({
                expireAt: {
                    $lt: currentTimeStamp
                }
            });
            console.log("cleanup successfully");
        } catch (error) {}
    },
    1000 * 60 * 30
);
