import crypto from "crypto";

import sendResponse from "../../helpers/sendResponse.js";
import {
    getSession,
    cleanupLogin,
    runRedisLua
} from "../../services/session.service.js";
import { findUser, updateUser } from "../../services/user.service.js";
import { securitycodeLua } from "../../constants/redis.contants.js";

import { verifyToken } from "../../helpers/jwt.js";
import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import {
    checkValidation,
    getTime,
    setRefreshExpiry
} from "../../helpers/helpers.js";
import { getIpInfo } from "../../helpers/ip.js";

import { verifyLoginValidator } from "../../validators/auth/verifyLogin.validator.js";

import { getRiskScore } from "../../utils/security/riskEngine.js";
import {
    sendSessionApproval,
    checkSessionApproval
} from "../../utils/security/sessionApproveal.js";

import { verifyKey } from "../../helpers/web.autn.js";

import { verifyHash } from "../../helpers/hash.js";

export const verifyLoginValidation = async (req, res, next) => {
    const time = getTime(req);
    const ctxId = req.signedCookies?.login_ctx;

    const validate = checkValidation(
        verifyLoginValidator,
        req,
        "validation faild for verify login"
    );

    if (!validate?.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value,
        getIpInfo(req.realIp)
    );

    const savedDeviceInfo = await getSession(`login:info:${ctxId}`);

    const savedInfo = await getSession(`login:ctx:${ctxId}`);

    if (!savedInfo?.success) {
        return sendResponse(res, 401, {
            message: "Your login session has expired. Please start again.",
            action: "RESTART_LOGIN"
        });
    }

    const user = await findUser({
        _id: savedInfo.userId
    });

    if (!user) {
        return sendResponse(res, 401, {
            message: "We couldn’t sign you in. Please start again.",
            action: "RESTART_LOGIN"
        });
    }

    const riskScore = await getRiskScore(getDeviceInfo, savedDeviceInfo, {
        time
    });

    if (riskScore > 0) {
        await cleanupLogin(ctxId);
        return sendResponse(
            res,
            401,
            "We detected unusual activity. This request has been stopped for your security"
        );
    }

    if (savedInfo.risk !== validate.value.risk) {
        await cleanupLogin(ctxId);
        return sendResponse(
            res,
            401,
            "This request is prevent Method-hopping attack!"
        );
    }

    if (
        savedInfo.allowedMethod &&
        !savedInfo.allowedMethod?.includes(validate.value.method)
    ) {
        await cleanupLogin(ctxId);
        return sendResponse(
            res,
            401,
            "This request is prevent Method-hopping attack!"
        );
    }

    req.auth = {
        refreshExpiry: setRefreshExpiry(validate.value),
        user: user,
        values: validate.value,
        info: savedInfo,
        ctxId,
        deviceInfo: getDeviceInfo,
        incomingCredentialId: Buffer.from(
            validate.value.id || "test",
            "base64url"
        )
    };

    return next();
};

export const verifyLoginTrustDevice = (req, res, next) => {
    const { user, deviceInfo, info } = req.auth;
    if (info.risk !== "verylow") return next();
    if (user.logout?.length) {
        const lastLogout = user.logout[user.logout.length - 1];
        if (lastLogout?.logout === "logout-all") return next();
    }

    if (info?.riskScore <= 5) {
        req.auth.verify = {
            success: true,
            method: "trusted_session"
        };
        return next();
    }

    const isTrusted = verifyToken(req.signedCookies.trustedSession);

    if (isTrusted?.success && isTrusted?.data.did === deviceInfo.deviceId) {
        req.auth.verify = {
            success: true,
            method: "trusted_session"
        };
        return next();
    }

    return next();
};

export const verifyLoginPasskey = async (req, res, next) => {
    const { user, info, ctxId, values, verify, incomingCredentialId } =
        req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (
        !["low", "mid", "high"].includes(info.risk) ||
        values.method !== "passkey"
    ) {
        return next();
    }

    const saved = await getSession(`passkey:login:${ctxId}`);

    if (!saved?.challenge) {
        return sendResponse(res, 401, {
            message: "Your login session has expired. Please start again.",
            action: "RESTART_LOGIN"
        });
    }

    const passkeyIndex = user.loginMethods.passkeys.findIndex(k =>
        k.credentialId.equals(incomingCredentialId)
    );

    if (passkeyIndex === -1) {
        req.auth.verify = {
            success: false,
            method: "passkey",
            message: "Invalid passkey credentialId!"
        };
        return next();
    }

    const verification = await verifyKey(values, saved, passkey);

    if (!verification?.success) {
        req.auth.verify = {
            success: false,
            method: "passkey",
            message: verification.message
        };
        return next();
    }

    user.loginMethod.passkeys[passkeyIndex].counter =
        verification.authenticationInfo.newCounter;

    await updateUser(
        {
            _id: user._id
        },
        {
            "loginMethod.passkeys": user.loginMethod.passkeys
        }
    );

    req.auth.verify = {
        success: true,
        method: "passkey"
    };

    return next();
};

export const verifyLoginPassword = async (req, res, next) => {
    const { user, info, values, verify } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (
        !["low", "mid", "high"].includes(info.risk) ||
        values.method !== "password"
    ) {
        return next();
    }

    if (!values.code) {
        return sendResponse(res, 400, {
            message: "Password is required to verify"
        });
    }

    const isValidPass = await verifyHash(values.code, user.password);

    if (!isValidPass) {
        req.auth.verify = {
            success: false,
            method: "password",
            stepup: info.risk === "high",
            message: "Invalid credentials!"
        };
        return next();
    }

    req.auth.verify = {
        success: true,
        stepup: info.risk === "high",
        method: "password"
    };

    return next();
};

export const verifyLoginSessionApproval = async (req, res, next) => {
    const { user, info, values, verify, deviceInfo } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (
        !["mid", "high", "veryhigh"].includes(info.risk) ||
        values.method !== "session_approval"
    ) {
        return next();
    }

    const approval = await getSession(`approval:${values.code}`);

    if (!approval) {
        const response = await sendSessionApproval(deviceInfo, user);
        return sendResponse(res, 200, response);
    }

    if (approval?.status === "pending") {
        return sendResponse(res, 202, "waiting for approval...");
    }

    req.auth.verify = checkSessionApproval(approval);

    return next();
};

export const verifyLoginSecurityCode = async (req, res, next) => {
    const { user, info, ctxId, values, verify } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (
        !["mid", "high", "veryhigh"].includes(info.risk) ||
        values?.method !== "security_code"
    ) {
        return next();
    }

    if (!values?.code) {
        return sendResponse(res, 400, {
            message: "security code is required to verify"
        });
    }

    const hashedCode = crypto
        .createHash("sha256")
        .update(values.code)
        .digest("hex");

    const saved = await runRedisLua(
        securitycodeLua,
        `securitycode:login:${hashedCode}`
    );

    if (!saved?.verified) {
        req.auth.verify = {
            success: false,
            method: "security_code",
            message: "Your security code  is inavlid or expired. try again.",
            action: "RESTRY_LOGIN"
        };
        return next();
    }

    req.auth.verify = {
        success: true,
        method: "security_code"
    };

    return next();
};
