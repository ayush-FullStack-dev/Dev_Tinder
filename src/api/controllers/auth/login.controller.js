import sendResponse, { setCtxId } from "../../../helpers/sendResponse.js";
import crypto from "crypto";

import { cookieOption } from "../../../constants/auth.constant.js";

import { findUser, updateUser } from "../../../services/user.service.js";

import { setSession, cleanupLogin } from "../../../services/session.service.js";
import { signToken } from "../../../helpers/jwt.js";
import { sendSuspiciousAlert } from "../../../helpers/mail.js";
import { getAccesToken, getRefreshToken } from "../../../helpers/token.js";
import { collectOnMethod } from "../../../helpers/helpers.js";
import { setTwoFa } from "../../../helpers/twoFa.js";

import { tokenBuilder } from "../../../utils/cron.js";
import { fingerprintBuilder } from "../../../utils/fingerprint.js";
import {
    calculateLoginRisk,
    sendSecurityUpgrade,
    resolveRiskLevel,
    buildLoginDecisionResponse
} from "../../../utils/security/loginRisk.js";
import {
    getRiskScore,
    getRiskLevel
} from "../../../utils/security/riskEngine.js";

export const loginIdentifyHandler = async (req, res) => {
    const { user, deviceInfo, time } = req.auth;
    const ctxId = crypto.randomBytes(16).toString("hex");
    const score = 80; // await calculateLoginRisk(user, deviceInfo, time);
    const riskLevel = await resolveRiskLevel(score, user.twoFA.enabled);

    if (riskLevel === "veryhigh" && !user.twoFA.enabled) {
        return sendSecurityUpgrade(user, res, deviceInfo);
    }

    const response = await buildLoginDecisionResponse(riskLevel, ctxId, user);

    await setSession(deviceInfo, ctxId, "login:info");

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
        "login:ctx"
    );
    return setCtxId(res, 200, response, ctxId, "login_ctx");
};

export const verifyLoginHandler = async (req, res) => {
    const { refreshExpiry, user, verify, deviceInfo, info, ctxId } = req.auth;
    const userInfo = {
        ...deviceInfo,
        loginContext: {
            primary: {
                method: verify.method
            },
            mfa: {
                required: false,
                complete: true,
                methodsUsed: "none"
            },
            trust: {
                deviceTrusted: true,
                sessionLevel: info.risk
            }
        }
    };

    const methods = collectOnMethod(user.twoFA.twoFAMethods);

    if (!verify?.success) {
        await cleanupLogin(ctxId);
        return sendResponse(res, 401, verify?.message || "Unauthorized");
    }

    if (verify?.stepup) {
        const data = await setTwoFa(ctxId, userInfo, methods);
        user.twoFA.tokenInfo.push(data.info);

        if (user.twoFA.token?.length > 10) {
            user.twoFA.token.shift();
        }

        await updateUser(
            user._id,
            {
                "twoFA.tokenInfo": user.twoFA.tokenInfo
            },
            {
                id: true
            }
        );

        return res
            .status(401)
            .clearCookie("login_ctx", cookieOption)
            .cookie("twoFA_ctx", data.ctxId, cookieOption)
            .json(data.response);
    }

    const accessToken = getAccesToken(user);
    const trustedSession = signToken({
        sub: user._id, // user identity
        did: deviceInfo.deviceId // trusted device
    });
    const refreshToken = getRefreshToken(
        {
            _id: user._id
        },
        refreshExpiry
    );

    userInfo.fingerprint = await fingerprintBuilder(userInfo);
    userInfo.token = refreshToken;

    user.refreshToken.push(tokenBuilder(userInfo));

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
        .clearCookie("login_ctx", cookieOption)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .cookie("trustedSession", trustedSession, cookieOption)
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
