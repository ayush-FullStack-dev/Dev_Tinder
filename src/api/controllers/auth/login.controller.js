import sendResponse from "../../../helpers/sendResponse.js";

import { cookieOption } from "../../../constants/auth.constant.js";

import { findUser, updateUser } from "../../../services/user.service.js";
import { setSession } from "../../../services/session.service.js";

import { verifyHash } from "../../../helpers/hash.js";
import { sendSuspiciousAlert } from "../../../helpers/mail.js";
import { getAccesToken, getRefreshToken } from "../../../helpers/token.js";

import {
    getRiskScore,
    getRiskLevel
} from "../../../utils/security/riskEngine.js";

import { fingerprintBuilder } from "../../../utils/fingerprint.js";
import { tokenBuilder } from "../../../utils/cron.js";

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

    if (!(await verifyHash(password, user.password))) {
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
        score = await getRiskScore(userInfo, lastSession, {
            time
        });
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
        sendSuspiciousAlert(user.email, userInfo);
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
            user,
            "2fa:data"
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
