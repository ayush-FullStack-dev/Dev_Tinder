import { verifyRefreshToken } from "../../helpers/token.js";
import sendResponse, { removeCookie } from "../../helpers/sendResponse.js";
import { findUser, updateUser } from "../../services/user.service.js";
import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import { getIpDetails } from "../../helpers/ip.js";
import { getTime } from "../../helpers/time.js";

import crypto from "crypto";

import { sendLogoutAllAlert } from "../../helpers/mail.js";
import { getLogoutInfo } from "../../helpers/logout.js";

export const extractLogoutInfo = async (req, res, next) => {
    const refreshToken = req.signedCookies.refreshToken;

    const device = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        await getIpDetails(req.realIp)
    );

    if (!refreshToken) {
        return sendResponse(res, 200, "You are already signed out");
    }

    req.auth = { refreshToken, device };
    next();
};

export const validateLogout = async (req, res, next) => {
    const { refreshToken } = req.auth;
    const decodeData = verifyRefreshToken(refreshToken);
    if (!decodeData?.success) {
        return removeCookie(res, 200, "You are already signed out");
    }

    const user = await findUser({
        _id: decodeData.data._id
    });

    if (!user) {
        return removeCookie(res, 200, "You are already signed out");
    }

    const tokenIndex = user.refreshToken.findIndex(
        t => t.token === refreshToken
    );

    if (tokenIndex === -1) {
        return removeCookie(res, 200, "You are already signed out");
    }

    if (user.refreshToken[tokenIndex]?.version !== 1) {
        return removeCookie(res, 200, "You are already signed out");
    }

    req.auth.user = user;
    req.auth.tokenIndex = tokenIndex;
    next();
};

// logout-all

export const logoutAllSession = async (req, res, next) => {
    const { user, device, reason } = req.auth;

    const invalidateAllRefreshToken = user.refreshToken.map(t => {
        const version = t.version + 1;
        return {
            ...t,
            version
        };
    });

    const logoutInfo = getLogoutInfo(reason || "manual", "logout-all", device);
    user.logout.push(logoutInfo);

    if (user.logout.length >= 15) {
        user.logout.shift();
    }

    device.name = user.name;
    device.fullTime = getTime().fullTime

    sendLogoutAllAlert(user.email, device);

    await updateUser(
        {
            _id: user._id
        },
        {
            refreshToken: invalidateAllRefreshToken,
            logout: user.logout
        }
    );

    if (next) {
        req.auth.logout = {
            success: true,
            logout: "logout-all"
        };

        return next();
    }
};

// logout one
export const logoutCurrentSession = async (req, res, next) => {
    const { user, tokenIndex, device, reason, action } = req.auth;
    const logoutInfo = getLogoutInfo(
        reason || "manual",
        action || "logout",
        device,
        user.refreshToken[tokenIndex].ctxId
    );
    user.logout.push(logoutInfo);
    if (user.logout.length >= 15) {
        user.logout.shift();
    }
    user.refreshToken.splice(tokenIndex, 1);
    await updateUser(
        {
            _id: user._id
        },
        {
            refreshToken: user.refreshToken,
            logout: user.logout
        }
    );

    if (next) {
        req.auth.logout = {
            success: true,
            logout: "logout",
            id: logoutInfo.id
        };

        return next();
    }

    return {
        success: false,
        logout: "logout",
        id: logoutInfo.id
    };
};
