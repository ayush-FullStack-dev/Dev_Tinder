import crypto from "crypto";

import sendResponse, { clearCtxId } from "../../helpers/sendResponse.js";

import { getTime, checkValidation } from "../../helpers/helpers.js";
import { getIpInfo } from "../../helpers/ip.js";
import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";

import { verifyAuthValidator } from "../../validators/auth/verifyAuth.validator.js";

import { getSession, cleanupLogin } from "../../services/session.service.js";

import { getRiskScore } from "../../utils/security/riskEngine.js";

import { checkMethodHooping } from "../../utils/security/attack.js";

export const verifyVerifaction = async (req, res, next) => {
    const { user } = req.auth;
    const ctxId = req.signedCookies.verify_ctx;
    const time = getTime(req);
    const validate = checkValidation(
        verifyAuthValidator,
        req,
        "validation faild for verification"
    );

    if (!validate?.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );

    const savedDeviceInfo = await getSession(`verify:info:${ctxId}`);
    const savedInfo = await getSession(`verify:ctx:${ctxId}`);

    if (!savedInfo?.success) {
        return sendResponse(res, 401, {
            message:
                "Your Verification session has expired. Please start again.",
            action: "RESTART_VERIFACTION"
        });
    }

    const riskScore = await getRiskScore(getDeviceInfo, savedDeviceInfo, {
        time
    });

    if (riskScore > 0) {
        await cleanupLogin(ctxId);
        return clearCtxId(
            res,
            401,
            "We detected unusual activity. This request has been stopped for your security",
            "verify_ctx"
        );
    }

    const isMethodHooping = checkMethodHooping(savedInfo, req.body);

    if (isMethodHooping) {
        await cleanupLogin(ctxId);
        return clearCtxId(res, 401, isMethodHooping, "verify_ctx");
    }

    req.auth = {
        ...req.auth,
        user: user,
        values: req.body,
        info: savedInfo,
        ctxId: ctxId,
        incomingCredentialId: Buffer.from(
            validate.value.id || "test",
            "base64url"
        ),
        deviceInfo: getDeviceInfo
    };

    return next();
};

export const verifedTwoFaUser = async (req, res, next) => {
    if (!req.query?.rpat) {
        return sendResponse(res, 400, "Send a valid rpat id");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(req.query?.rpat)
        .digest("hex");

    const getDeviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );

    const data = await getSession(`verify:2fa:${hashedToken}`);

    if (!data?.verified) {
        return sendResponse(res, 401, {
            message: "Your TwoFa session has expired. Please start again.",
            action: "RESTART_VERIFACTION"
        });
    }

    req.auth = {
        ...req.auth,
        verifyInfo: data,
        device: getDeviceInfo,
        hashedToken
    };

    return next();
};
