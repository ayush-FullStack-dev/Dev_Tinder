import sendResponse from "../../helpers/sendResponse.js";

import { getSession, cleanupLogin } from "../../services/session.service.js";
import { findUser, updateUser } from "../../services/user.service.js";

import { verifyToken } from "../../helpers/jwt.js";
import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import {
    checkValidation,
    getTime,
    getIpInfo,
    setRefreshExpiry
} from "../../helpers/helpers.js";

import { verifyLoginValidator } from "../../validators/auth/verifyLogin.validator.js";

import { getRiskScore } from "../../utils/security/riskEngine.js";
import { sendSessionApproval } from "../../utils/security/sessionApproveal.js";

import { verifyKey } from "../../helpers/web.autn.js";

import { verifyHash } from "../../helpers/hash.js";

export const verifyLoginValidation = async (req, res, next) => {
    req.auth = {};
    const time = getTime(req);
    const ctxId = req.body.ctxId;

    const validate = checkValidation(
        verifyLoginValidator,
        req,
        "validation faild for verify login"
    );

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value,
        getIpInfo(req.realIp)
    );

    const savedDeviceInfo = await getSession(`login:info:${ctxId}`);

    const savedInfo = await getSession(`login:ctx:${ctxId}`);
    getDeviceInfo.deviceSize = savedDeviceInfo?.deviceSize;

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

    if (
        savedInfo.risk !== validate.value.risk ||
        !savedInfo.allowedMethod.includes(validate.value.method)
    ) {
        await cleanupLogin(ctxId);
        return sendResponse(
            res,
            401,
            "This request is prevent Method-hopping attack!"
        );
    }

    getDeviceInfo.deviceName = `${getDeviceInfo.browser} on ${getDeviceInfo.os}`;
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    req.auth.user = user;
    req.auth.values = validate.value;
    req.auth.info = savedInfo;
    req.auth.ctxId = ctxId;
    req.auth.incomingCredentialId = Buffer.from(
        validate.value.id || "test",
        "base64url"
    );

    req.auth.deviceInfo = getDeviceInfo;
    return next();
};

export const verifyLoginTrustDevice = (req, res, next) => {
    const { user, deviceInfo, info } = req.auth;
    if (info.risk !== "verylow") return next();

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

    if (!["low", "mid"].includes(info.risk) || values.method !== "passkey") {
        return next();
    }

    const saved = await getSession(`passkey:login:${ctxId}`);

    if (!saved?.challenge) {
        return sendResponse(res, 401, {
            message: "Your login session has expired. Please start again.",
            action: "RESTART_LOGIN"
        });
    }

    const passkey = user.passkeys.find(k =>
        k.credentialId.equals(incomingCredentialId)
    );

    if (!passkey) {
        req.auth.verify = {
            success: false,
            method: "passkey",
            message: "Invalid passkey credentialId!"
        };
        return next();
    }

    user.passkeys = user.passkeys.filter(
        n => !n.credentialId.equals(passkey.credentialId)
    );

    const verification = await verifyKey(values, saved, passkey);

    if (!verification?.success) {
        req.auth.verify = {
            success: false,
            method: "passkey",
            message: verification.message
        };
        return next();
    }

    passkey.counter = verification.authenticationInfo.newCounter;
    user.passkeys.push(passkey);

    await updateUser(
        {
            _id: user._id
        },
        {
            passkeys: user.passkeys
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
            message: "Password is invalid"
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

    if (approval?.status === "approved") {
        req.auth.verify = {
            success: true,
            method: "session_approval",
            stepup: info.risk === "high" || info.risk === "veryhigh"
        };
        return next();
    }

    if (approval?.status === "declined") {
        req.auth.verify = {
            success: false,
            message: "session approval rejected by user",
            method: "session_approval"
        };
        return next();
    }

    if (approval?.status === "pending") {
        return sendResponse(res, 202, "waiting for approval...");
    }

    return next();
};

export const verifyLoginSecurityKey = async (req, res, next) => {
    const { user, info, ctxId, values, verify, incomingCredentialId } =
        req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    if (
        !["high", "veryhigh"].includes(info.risk) ||
        values.method !== "security_key"
    ) {
        return next();
    }

    const saved = await getSession(`securitykey:login:${ctxId}`);

    if (!saved?.challenge) {
        return sendResponse(res, 401, {
            message: "Your login session has expired. Please start again.",
            action: "RESTART_LOGIN"
        });
    }

    const securityKey = user.securityKeys.find(k =>
        k.credentialId.equals(incomingCredentialId)
    );

    if (!securityKey) {
        req.auth.verify = {
            success: false,
            method: "security_key",
            message: "Invalid security Key credentialId!"
        };
        return next();
    }

    user.securityKeys = user.securityKeys.filter(
        n => !n.credentialId.equals(securityKey.credentialId)
    );

    const verification = await verifyKey(values, saved, securityKey);

    if (!verification?.success) {
        req.auth.verify = {
            success: false,
            method: "security_key",
            message: verification.message
        };
        return next();
    }

    securityKey.counter = verification.authenticationInfo.newCounter;

    user.securityKeys.push(securityKey);

    await updateUser(
        {
            _id: user._id
        },
        {
            securityKeys: user.securityKeys
        }
    );

    req.auth.verify = {
        success: true,
        method: "security_key"
    };

    return next();
};
