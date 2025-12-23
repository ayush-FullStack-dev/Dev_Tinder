import sendResponse, { clearCtxId } from "../../../helpers/sendResponse.js";
import { getLogoutInfo } from "../../../helpers/logout.js";
import { verifyHash, generateHash } from "../../../helpers/hash.js";

import { getSession, setSession } from "../../../services/session.service.js";
import { updateUser } from "../../../services/user.service.js";

import { sendPasswordChangedAlert } from "../../../helpers/mail.js";

export const changePasswordHandler = async (req, res, next) => {
    const { user, verify, ctxId, deviceInfo, findedCurrent } = req.auth;
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
        await setSession(
            {
                verified: true,
                ...verify
            },
            ctxId,
            `change:password`
        );

        return sendResponse(res, 200, {
            next: "submit_new_password"
        });
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
