import crypto from "crypto";
import sendResponse, { setCtxId } from "../../../helpers/sendResponse.js";

import { buildDeviceInfo } from "../../../helpers/buildDeviceInfo.js";
import { getIpInfo } from "../../../helpers/helpers.js";
import { fingerprintBuilder } from "../../../utils/fingerprint.js";
import {
    calculateLoginRisk,
    resolveRiskLevel,
    buildVerifyDecisionResponse,
    sendSecurityUpgrade
} from "../../../utils/security/loginRisk.js";

import { setSession, cleanupLogin } from "../../../services/session.service.js";

export const verifyIdentifyHandler = async (req, res, next) => {
    const ctxId = crypto.randomBytes(16).toString("hex");
    const { user } = req.auth;
    const time = req.body.clientTime || Date.now();
    const deviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );
    deviceInfo.fingerprint = await fingerprintBuilder(deviceInfo);
    const score = await calculateLoginRisk(user, deviceInfo, time);
    let riskLevel = await resolveRiskLevel(score, user.twoFA.enabled);
    riskLevel = riskLevel === "verylow" ? "low" : riskLevel;
    const response = await buildVerifyDecisionResponse(riskLevel, ctxId, user);

    if (riskLevel === "veryhigh" && !user.twoFA.enabled) {
        return sendSecurityUpgrade(user, res, deviceInfo);
    }

    await setSession(deviceInfo, ctxId, "verify:info");
    await setSession(
        {
            success: true,
            risk: riskLevel,
            allowedMethod: response.allowedMethod,
            stepUp: response.stepUp,
            riskScore: score,
            userId: user._id
        },
        ctxId,
        "verify:ctx"
    );

    return setCtxId(
        res,
        200,
        {
            ...response,
            message: "you need to verify"
        },
        ctxId,
        "verify_ctx"
    );
};

export const verifyVerifactionHandler = async (req, res, next) => {
    const { verify, ctxId } = req.auth;

    if (!verify?.success) {
        await cleanupLogin(ctxId);
        return sendResponse(res, 401, verify?.message || "Unauthorized");
    }

    return next();
};
