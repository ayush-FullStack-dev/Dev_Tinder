import sendResponse, { removeCookie } from "../../helpers/sendResponse.js";
import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import { verifyRefreshToken } from "../../helpers/token.js";
import {
    collectOnMethod,
    getTime,
    setRefreshExpiry
} from "../../helpers/helpers.js";
import { getIpInfo } from "../../helpers/ip.js";
import { setTwoFa } from "../../helpers/twoFa.js";
import { getAccesToken, getRefreshToken } from "../../helpers/token.js";

import { findUser, updateUser } from "../../services/user.service.js";
import { getSession } from "../../services/session.service.js";

import { tokenBuilder } from "../../utils/cron.js";
import { getRiskScore, getRiskLevel } from "../../utils/security/riskEngine.js";
import {
    sendSessionApproval,
    checkSessionApproval
} from "../../utils/security/sessionApproveal.js";
import {
    compareFingerprint,
    fingerprintBuilder
} from "../../utils/fingerprint.js";

export const extractRefreshToken = (req, res, next) => {
    const oldRefreshToken = req.signedCookies?.refreshToken;
    const oldAccessToken = req.signedCookies?.accessToken;

    if (!oldRefreshToken) {
        return sendResponse(
            res,
            401,
            "we cannot process request without token your cookies is invalid or corrupted "
        );
    }

    req.auth = {
        oldRefreshToken,
        oldAccessToken
    };
    next();
};

export const validateRefreshToken = async (req, res, next) => {
    const { oldRefreshToken, oldAccessToken } = req.auth;

    const decodePayload = verifyRefreshToken(oldRefreshToken);

    if (!decodePayload?.success) {
        return sendResponse(res, 401, decodePayload.message);
    }

    const user = await findUser({
        _id: decodePayload.data._id
    });

    if (!user) {
        return removeCookie(
            res,
            401,
            "Invalid or expired refreshToken provided!"
        );
    }

    const findedToken = user.refreshToken.find(
        k => k.token === oldRefreshToken
    );

    if (findedToken?.version !== 1) {
        return removeCookie(res, 401, "Session expired Sign in to continue");
    }

    req.auth.user = user;
    req.auth.token = findedToken;
    next();
};

export const bindTokenToDevice = async (req, res, next) => {
    const { token, verify, user } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    const tokenInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );

    tokenInfo.loginContext = token.loginContext;
    tokenInfo.loginContext.mfa = {
        required: true,
        complete: false
    };

    const validFp = await compareFingerprint(tokenInfo, token.fingerprint);
    tokenInfo.fingerprint = await fingerprintBuilder(tokenInfo);

    if (token.deviceId !== req.body.deviceId) {
        req.auth.verify = {
            success: false,
            message:
                "For your security, this session has been signed out. Please sign in again.",
            action: "logout-all"
        };
        return next();
    }
    if (!validFp) {
        req.auth.verify = {
            success: false,
            message: "We need to verify it's really you before continuing.",
            stepup: "2fa"
        };
        return next();
    }

    req.auth.tokenInfo = tokenInfo;
    req.auth.tokenIndex = user.refreshToken.findIndex(
        t => t.token === token.token
    );
    return next();
};

export const reEvaluateRisk = async (req, res, next) => {
    const { tokenInfo, token, verify } = req.auth;

    if (verify?.success !== undefined) {
        return next();
    }

    const time = getTime(req);
    const score = await getRiskScore(tokenInfo, token, {
        time
    });

    const riskLevel = getRiskLevel(score);

    req.auth.riskLevel = riskLevel;
    tokenInfo.loginContext.trust = {
        deviceTrusted: true,
        sessionLevel: riskLevel
    };

    if (riskLevel === "veryhigh") {
        req.auth.verify = {
            success: false,
            action: "logout",
            message:
                "We detected unusual activity on this session. For your security, you’ve been signed out. Please sign in again"
        };
        return next();
    } else if (riskLevel === "mid" || riskLevel === "high") {
        req.auth.verify = {
            success: false,
            message:
                "We need to verify it’s really you. Please complete an additional security check.",
            stepup: "2fa"
        };
        return next();
    }

    return next();
};

export const handleStepUpIfNeeded = async (req, res, next) => {
    const { verify, tokenInfo, riskLevel, user, tokenIndex } = req.auth;

    if (verify?.success === undefined || verify?.stepup !== "2fa") {
        return next();
    }

    if (riskLevel === "high") {
        const methods = collectOnMethod(user.twoFA.loginMethods);
        const data = await setTwoFa(undefined, tokenInfo, methods);
        user.refreshToken[tokenIndex] = data.info;
        await updateUser(
            user._id,
            {
                refreshToken: user.refreshToken
            },
            {
                id: true
            }
        );
        return removeCookie(res, 401, data.response);
    }

    const approval = await getSession(`approval:${req.body.code}`);

    if (!approval) {
        const response = await sendSessionApproval(tokenInfo, user);
        return sendResponse(res, 200, response);
    }

    if (approval?.status === "pending") {
        return sendResponse(res, 202, "waiting for approval...");
    }

    req.auth.verify = checkSessionApproval(approval);
    return next();
};

export const rotateRefreshToken = async (req, res, next) => {
    const { token, user, tokenIndex, tokenInfo } = req.auth;
    const refreshExpiry = setRefreshExpiry(req.body);
    const accessToken = getAccesToken(user);
    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    tokenInfo.token = refreshToken;
    tokenInfo.lastActive = new Date();
    console.log("test");
    user.refreshToken.splice(tokenIndex, 1, tokenBuilder(tokenInfo));
    req.auth.refreshToken = refreshToken;
    req.auth.accessToken = accessToken;
    return next();
};
