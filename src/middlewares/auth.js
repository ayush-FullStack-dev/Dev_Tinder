import redis from "../config/redis.js";
import epochify from "epochify";
import geoip from "geoip-lite";
import { totp } from "otplib";

import {
    signupValidators,
    loginValidators,
    twoFAValidators,
    verifyTwoFAValidators
} from "../api/validators/auth.js";
import { findUser, updateUser } from "../api/services/auth.js";
import { compareFingerprint } from "../helpers/fingerprint.js";
import {
    sendResponse,
    parseUA,
    buildDeviceInfo,
    setRefreshExpiry,
    checkValidation
} from "../helpers/helpers.js";
import { checkDeviceSwap, checkTimeManipulation } from "../utils/util.js";
import { verifyHash } from "../helpers/hash.js";
import ApiError, { prettyErrorResponse } from "../helpers/ApiError.js";
import { setSession } from "../api/services/service.js";

function getCountry(ip) {
    const geo = geoip.lookup(ip);
    return geo?.country || "UNKNOWN";
}

function getTime(req) {
    const time = epochify.getFullDateTime();
    const clientTime = new Date(req.body.clientTime).getTime();
    return {
        serverTime: time.timestamp,
        clientTime: clientTime
    };
}

export const signupValidation = async (req, res, next) => {
    req.body.gender = req.body.gender || "male";
    req.body.role = "user";

    const validateError = checkValidation(
        signupValidators,
        req,
        "vaildation failed for register"
    );

    if (validateError) {
        return sendResponse(res, 400, validateError);
    }

    const emailExist = await findUser({
        email: req.body.email
    });

    if (emailExist && emailExist.username === req.body.username) {
        return sendResponse(res, 401, {
            message: `${emailExist.email} email && ${emailExist.username} is already taken use different email && username to signup`
        });
    } else if (emailExist) {
        return sendResponse(res, 401, {
            message: `${req.body.email} email is already taken use different email to signup`
        });
    }

    const usernameExist = await findUser({
        username: req.body.username
    });

    if (usernameExist) {
        return sendResponse(res, 401, {
            message: `${usernameExist.username} username is already taken use different username to signup`
        });
    }

    if (req.body.email === process.env.ADMIN_MAIL) {
        req.body.role = "admin";
    }
    return next();
};

export const loginValidation = (req, res, next) => {
    req.auth = {};
    const { email, username } = req.body;

    const validateError = checkValidation(
        loginValidators,
        req,
        "vaildation failed for login"
    );

    if (validateError) {
        return sendResponse(res, 400, validateError);
    }

    if (email) {
        req.auth.login = email;
        req.auth.fieldName = "email";
    } else {
        req.auth.login = username;
        req.auth.fieldName = "username";
    }

    req.auth.ip = req.ip;
    req.auth.deviceInfo = {
        ...buildDeviceInfo(req.headers["user-agent"], validate.value)
    };
    req.auth.country = getCountry(req.auth.ip);
    req.auth.password = validate.value.password;
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    next();
};

export const twoFAValidation = (req, res, next) => {
    req.auth = {};
    const validateError = checkValidation(
        twoFAValidators,
        req,
        "vaildation failed for twoFactorAuthentication"
    );

    if (validateError) {
        return sendResponse(res, 400, validateError);
    }

    req.auth.email = validate.value.email;
    req.auth.ip = req.ip;
    req.auth.country = getCountry(req.ip);
    req.auth.loginMethod = validate.value.method || null;
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    req.auth.deviceInfo = {
        ...buildDeviceInfo(req.headers["user-agent"], validate.value)
    };
    next();
};

export const verifyTwoFAValidation = async (req, res, next) => {
    req.auth = {};
    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value
    );
    const time = getTime(req);
    const trustedDeviceId = req.signedCookies.trustedDeviceId;
    const deviceInfo = {
        ip: req.ip,
        country: getCountry(req.ip),
        browser: getDeviceInfo.browser,
        os: getDeviceInfo.os,
        deviceModel: getDeviceInfo.deviceModel,
        deviceId: validate.value.deviceId
    };

    const validateError = checkValidation(
        verifyTwoFAValidators,
        req,
        "vaildation failed for twoFactorAuthentication"
    );

    if (validateError) {
        return sendResponse(res, 400, validateError);
    }

    const isDeviceSwap = checkDeviceSwap(
        ...getDeviceInfo,
        `device:info:${user._id}`,
        ["time"]
    );
    if (isDeviceSwap) {
        sendResponse(res, 401, isDeviceSwap);
    }

    const isTimeManipulation = checkTimeManipulation(time);
    if (isTimeManipulation) {
        return sendResponse(res, 401, isTimeManipulation);
    }

    const user = await findUser({
        email: req.body.email
    });

    if (!user) {
        return sendResponse(res, 401, {
            message: "user not found!"
        });
    }

    let isValid = await redis.get(`2fa:session:${user._id}`);
    isValid = JSON.parse(isValid);
    if (!isValid?.start) {
        return sendResponse(res, 401, {
            message: "2FA session not found start first 2fa",
            route: "/auth/verify-2fa/start/"
        });
    }

    let savedFp = await redis.get(`2fa:fp:start:${user._id}`);

    const fingerprintValid = await compareFingerprint(checkDeviceInfo, savedFp);
    if (!fingerprintValid) {
        return "This request is blocked for securty reason";
    }

    const isRemeberDevice = await redis.exists(
        `trusted:${user._id}:${savedFp}`
    );
    if (isRemeberDevice) {
        req.auth.verify = { success: true };
    }

    req.auth.loginMethod = validate.value.method.toLocaleLowerCase();

    if (isValid.method !== req.auth.loginMethod) {
        return sendResponse(res, 401, {
            message: "This req prevent method-hopping attack!"
        });
    }

    let isTrustedDevice = await redis.get(`trustedDevice:${trustedDeviceId}`);
    isTrustedDevice = JSON.parse(isTrustedDevice);
    if (isTrustedDevice?.userId === user._id) {
        req.auth.verify = { success: true };
    }

    let refreshExpiry = setRefreshExpiry(validate.value);
    req.auth.user = user;
    req.auth.code = validate.value.code;
    req.auth.method = user.twoFA.loginMethods;
    req.auth.time = time.serverTime;
    req.auth.fingerprintHash = savedFp;
    req.auth.deviceInfo = {
        ...deviceInfo
    };
    req.auth.userInfo = {
        userId: user._id,
        fingerprintHash: req.auth.fingerprintHash,
        deviceName: `${deviceInfo.browser} on ${deviceInfo.os}`,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    next();
};

export const verifyTwoFAEmail = async (req, res, next) => {
    let { user, loginMethod, code, method, verify } = req.auth;

    if (verify?.success) {
        return next();
    }
    if (loginMethod === "email" && !method.email.on) {
        await redis.del(`2fa:session:${user._id}`);
        return sendResponse(res, 401, {
            message: "email is disabled!"
        });
    }

    if (loginMethod === "email" && method.email.on) {
        const key = `otp:${user._id}`;
        const getOtp = await redis.get(key);
        if (!getOtp) {
            await redis.del(`2fa:session:${user._id}`);
            return sendResponse(res, 401, {
                message: "one time password is currpted or or expire"
            });
        }
        const checkOtp = await verifyHash(code, getOtp);
        if (!checkOtp) {
            req.auth.verify = {
                success: false,
                message: "one time password is currpted or or invalid!"
            };
        } else {
            await redis.del(key);
            req.auth.verify = { success: true };
        }
    }

    return next();
};

export const verifyTwoFATotp = async (req, res, next) => {
    let { user, loginMethod, code, method, verify } = req.auth;
    if (verify?.success) return next();

    if (loginMethod === "totp" && !method.totp.on) {
        await redis.del(`2fa:session:${user._id}`);
        return sendResponse(res, 401, {
            message: "totp in disabled!"
        });
    }

    if (loginMethod === "totp" && method.totp.on) {
        const isCodeValid = await redis.get(`totp:last:${user._id}`);

        if (isCodeValid === code) {
            return sendResponse(res, 401, {
                message: "replay attack detected"
            });
        }

        const isValid = totp.verify({
            token: code,
            secret: method.totp.code,
            window: 1
        });

        if (!isValid) {
            req.auth.verify = {
                success: false,
                message: "totp code is invalid!"
            };
            await redis.set(`totp:last:${user._id}`, code, "EX", 60);
        } else {
            req.auth.verify = { success: true };
        }
    }

    return next();
};

export const verifyTwoFABackupcode = async (req, res, next) => {
    let { user, loginMethod, code, method, verify } = req.auth;

    if (verify?.success) return next();

    if (loginMethod === "backupcode" && !method.backupcode.code.length) {
        await redis.del(`2fa:session:${user._id}`);
        return sendResponse(res, 401, {
            message: "BackupCode is disabled!"
        });
    }

    if (loginMethod === "backupcode" && method.backupcode.code.length) {
        let existsCode = null;
        for (const backupcode of method.backupcode.code) {
            const verifyCode = await verifyHash(code, backupcode);
            if (verifyCode) {
                existsCode = backupcode;
                break;
            }
        }
        if (!existsCode) {
            req.auth.verify = {
                success: false,
                message: "Backup code is invalid!"
            };
        } else {
            method.backupcode.code = method.backupcode.code.filter(
                backupcode => backupcode !== existsCode
            );
            await updateUser(user._id, {
                twoFA: user.twoFA
            });
            req.auth.verify = { success: true };
        }

        return next();
    }

    return next();
};
