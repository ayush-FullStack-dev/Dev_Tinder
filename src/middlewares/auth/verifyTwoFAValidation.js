import verifyTwoFAValidators from "../../validators/auth/verifyTwoFA.validator.js";

import sendResponse from "../../helpers/sendResponse.js";

import redis from "../../config/redis.js";

import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import { verifyHash } from "../../helpers/hash.js";
import {
    getTime,
    getIpInfo,
    setRefreshExpiry,
    checkValidation
} from "../../helpers/helpers.js";

import { isDeviceTrusted } from "../../services/auth.service.js";
import { findUser } from "../../services/user.service.js";
import { cleanup2fa, getSession } from "../../services/session.service.js";

import { getRiskScore } from "../../utils/security/riskEngine.js";
import { verifyTotpCode } from "../../utils/security/totp.js";

export const verifyTwoFAValidation = async (req, res, next) => {
    req.auth = {};
    const time = getTime(req);
    const trustedDeviceId = req.signedCookies.trustedDeviceId;
    const loginMethod = req.body.method.toLocaleLowerCase();
    const ctxId = req.body.ctxId;
    const validate = checkValidation(
        verifyTwoFAValidators,
        req,
        "vaildation failed for verify twoFactorAuthentication"
    );

    if (!validate?.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    const user = await findUser({
        email: req.body.email
    });

    if (!user) {
        return sendResponse(res, 401, {
            message: "user not found!"
        });
    }

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value,
        getIpInfo(req.realIp)
    );

    // validate that the 2FA session actually exists
    let isValid = await getSession(`2fa:session:${ctxId}`);

    if (!isValid?.start) {
        return sendResponse(res, 401, {
            message: "2FA session not found start first 2fa",
            route: "/auth/verify-2fa/start/"
        });
    }

    // getting  /start route values
    let savedInfo = await getSession(`device:info:${ctxId}`);
    let savedFp = await getSession(`2fa:fp:start:${ctxId}`, "string");
    savedInfo.fingerprint = savedFp;
    getDeviceInfo.deviceSize = savedInfo.deviceSize;

    // if any device/geo/fp change happened after /start → block immediately
    const riskScore = await getRiskScore(getDeviceInfo, savedInfo, { time });
    if (riskScore > 0) {
        await cleanup2fa(ctxId);
        return sendResponse(
            res,
            401,
            "We detected unusual activity. This request has been stopped for your security"
        );
    }

    if (isValid.method !== loginMethod) {
        await cleanup2fa(ctxId);
        return sendResponse(res, 401, {
            message: "This req prevent method-hopping attack!"
        });
    }

    // check device exist in trusted if exist then don't ask 2fa direct login else 2fa continue
    if (user.logout?.length) {
        const lastLogout = user.logout[user.logout.length - 1];
        if (lastLogout.logout !== "logout-all") {
            req.auth.verify = await isDeviceTrusted({
                ctxId,
                trustedId: trustedDeviceId,
                fingerprint: savedFp
            });
        }
    }
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    req.auth.user = user;
    req.auth.ctxId = ctxId;
    req.auth.time = time;
    req.auth.loginMethod = loginMethod;
    req.auth.riskLevel = await getSession(`2fa:data:${ctxId}`).risk;
    req.auth.code = validate.value.code;
    req.auth.method = user.twoFA.loginMethods;
    req.auth.deviceInfo = getDeviceInfo;
    req.auth.userInfo = {
        userId: user._id,
        fingerprintHash: savedFp,
        deviceName: `${getDeviceInfo.browser} on ${getDeviceInfo.os}`,
        createdAt: Date.now(),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };
    next();
};

export const verifyTwoFAEmail = async (req, res, next) => {
    let { user, loginMethod, code, method, verify, ctxId } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (loginMethod === "email" && !method.email.on) {
        await cleanup2fa(ctxId);
        return sendResponse(res, 401, {
            message: "email is disabled!"
        });
    }

    if (loginMethod === "email" && method.email.on) {
        const key = `otp:${ctxId}`;
        const getOtp = await getSession(key, "string");
        if (!getOtp) {
            await cleanup2fa(ctxId);
            return sendResponse(res, 401, {
                message: "one time password is invalid!"
            });
        }
        const checkOtp = await verifyHash(code, getOtp);
        if (!checkOtp) {
            req.auth.verify = {
                success: false,
                message: "one time password is currpted or  invalid!",
                method: "email_otp"
            };
        } else {
            await redis.del(key);
            await cleanup2fa(ctxId);
            req.auth.verify = { success: true, method: "email_otp" };
        }
    }

    return next();
};

export const verifyTwoFATotp = async (req, res, next) => {
    let { user, loginMethod, code, method, verify, ctxId } = req.auth;
    if (verify?.success) return next();

    if (loginMethod === "totp" && !method.totp.on) {
        await cleanup2fa(ctxId);
        return sendResponse(res, 401, {
            message: "totp in disabled!"
        });
    }

    if (loginMethod === "totp" && method.totp.on) {
        const isCodeValid = await getSession(`totp:last:${ctxId}`, "string");

        if (isCodeValid === code) {
            await cleanup2fa(ctxId);
            return sendResponse(res, 401, {
                message: "replay attack detected"
            });
        }

        req.auth.verify = verifyTotpCode(code, method.totp.code);

        if (!verify?.success) {
            await redis.set(`totp:last:${ctxId}`, code, "EX", 60);
        }
    }

    return next();
};

export const verifyTwoFABackupcode = async (req, res, next) => {
    let { user, loginMethod, code, method, verify, ctxId } = req.auth;

    if (verify?.success) return next();

    if (loginMethod === "backupcode" && !method.backupcode.code.length) {
        await cleanup2fa(ctxId);
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
                message: "Backup code is invalid!",
                method: "backup_code"
            };
        } else {
            method.backupcode.code = method.backupcode.code.filter(
                backupcode => backupcode !== existsCode
            );
            await updateUser(user._id, {
                twoFA: user.twoFA
            });
            req.auth.verify = { success: true, method: "backup_code" };
        }

        return next();
    }

    return next();
};
