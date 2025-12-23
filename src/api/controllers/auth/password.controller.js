import crypto from "crypto";

import sendResponse, { clearCtxId } from "../../../helpers/sendResponse.js";
import { getLogoutInfo } from "../../../helpers/logout.js";
import { verifyHash, generateHash } from "../../../helpers/hash.js";

import { getSession, setSession } from "../../../services/session.service.js";
import { findUser, updateUser } from "../../../services/user.service.js";

import {
    sendPasswordChangedAlert,
    sendforgotPasswordReq
} from "../../../helpers/mail.js";

export const changePasswordHandler = async (req, res, next) => {
    const { user, deviceInfo, ctxId, findedCurrent } = req.auth;
    deviceInfo.name = user.name;
    const getData = await getSession(`change:password:${ctxId}`);
    const invalidateRefreshToken = user.refreshToken.map(t => {
        if (t.ctxId === findedCurrent.ctxId) {
            return t;
        }
        return {
            ...t,
            version: t.version + 1
        };
    });

    if (!getData?.verified) {
        return next();
    }

    const isValidPass =
        /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/.test(
            req.body?.password
        );

    if (!isValidPass) {
        return sendResponse(res, 400, "please enter a valid password");
    }

    const oldPass = await verifyHash(req.body.password, user.password);
    const logoutInfo = getLogoutInfo(
        "password_changed",
        "password_change",
        deviceInfo
    );

    if (oldPass) {
        return sendResponse(
            res,
            400,
            "Your new password must be different from your current password"
        );
    }

    user.logout.push(logoutInfo);
    if (user.logout.length >= 15) {
        user.logout.shift();
    }

    await updateUser(
        user._id,
        {
            password: await generateHash(req.body.password),
            refreshToken: invalidateRefreshToken,
            logout: user.logout
        },
        {
            id: true
        }
    );

    sendPasswordChangedAlert(user.email, deviceInfo);

    return clearCtxId(res, 200, "Password changed successfully", "verify_ctx");
};

export const forgotPasswordHandler = async (req, res) => {
    const { email } = req.body;
    const isMail =
        /^[a-zA-Z0-9._%+-]{1,64}@[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63}){1,3}$/.test(
            email
        );

    if (!isMail) {
        return sendResponse(res, 400, "Enter a valid email address");
    }

    const user = await findUser({
        email
    });

    if (user) {
        const token = crypto
            .randomBytes(Number(process.env.BYTE))
            .toString("hex");
        const link = `${process.extra.DOMAIN_LINK}/auth/reset-password/${token}`;

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await setSession(
            {
                userId: user?._id
            },
            hashedToken,
            "forgot:password",
            "EX",
            600
        );

        await sendforgotPasswordReq(user, link);
    }

    return sendResponse(
        res,
        200,
        "we've sent password reset link successfully"
    );
};
