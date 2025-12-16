import sendResponse from "../../helpers/sendResponse.js";

import { sendSuspiciousAlert } from "../../helpers/mail.js";
import { getRiskLevel, getRiskScore } from "./riskEngine.js";

import { getPasskey, getSecurityKey } from "../../helpers/web.autn.js";

import { setSession } from "../../services/session.service.js";

export const calculateLoginRisk = async (user, userInfo, time) => {
    let score = 0;
    if (user.refreshToken.length) {
        const lastSession = user.refreshToken[user.refreshToken.length - 1];
        score = await getRiskScore(userInfo, lastSession, {
            time
        });
    }

    return score;
};

export const resolveRiskLevel = async (score, enabled) => {
    let riskLevel = "low";
    if (enabled) {
        if (score >= 85) {
            riskLevel = "veryhigh";
        } else {
            riskLevel = "mid";
        }
    } else {
        riskLevel = await getRiskLevel(score);
    }

    return riskLevel;
};

export const sendSecurityUpgrade = (user, res, deviceInfo) => {
    sendSuspiciousAlert(user.email, deviceInfo);
    return sendResponse(res, 403, {
        success: false,
        code: "SECURITY_UPGRADE_REQUIRED",
        message:
            "We detected unusual activity. Please secure your account to continue.",
        risk: "veryhigh",
        required: ["2fa"],
        allowedNext: ["enable_2fa", "account_recovery"]
    });
};

export const buildLoginDecisionResponse = async (riskLevel, ctxId, user) => {
    const passkey = await getPasskey(user);
    const securityKey = await getSecurityKey(user);
    if (riskLevel === "verylow") {
        return {
            action: "AUTO_LOGIN",
            risk: riskLevel,
            message: "Signed in automatically"
        };
    }
    if (riskLevel === "low") {
        await setSession(
            { challenge: passkey.challenge },
            ctxId,
            "passkey:login"
        );
        return {
            action: "REQUIRED_METHOD",
            risk: riskLevel,
            loginCtx: ctxId,
            allowedMethod: ["passkey", "password"],
            passkey
        };
    }
    if (riskLevel === "mid") {
        await setSession(
            { challenge: passkey.challenge },
            ctxId,
            "passkey:login"
        );
        return {
            action: "REQUIRED_METHOD",
            risk: riskLevel,
            loginCtx: ctxId,
            allowedMethod: ["passkey", "password", "session_approval"],
            passkey
        };
    }
    if (riskLevel === "high") {
        await setSession(
            { challenge: securityKey.challenge },
            ctxId,
            "securitykey:login"
        );
        return {
            action: "REQUIRED_METHOD",
            risk: riskLevel,
            loginCtx: ctxId,
            allowedMethod: ["password", "securty_key"],
            stepUp: ["2fa"],
            securitykey: securityKey
        };
    }
    await setSession(
        { challenge: securityKey.challenge },
        ctxId,
        "securitykey:login"
    );
    return {
        action: "REQUIRED_METHOD",
        risk: riskLevel,
        loginCtx: ctxId,
        allowedMethod: ["securty_key"],
        stepUp: ["2fa"],
        securitykey: securityKey
    };
};
