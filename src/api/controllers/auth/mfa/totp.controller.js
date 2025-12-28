import { authenticator } from "otplib";
import QRCode from "qrcode";
import fs from "fs";

import sendResponse from "../../../../helpers/sendResponse.js";
import { updateUser } from "../../../../services/user.service.js";
import { cleanupMfa } from "../../../../services/session.service.js";

export const activeTotpHandler = (req, res) => {
    const { user } = req.auth;
    return sendResponse(res, 200, {
        enabled: user.twoFA.twoFAMethods.totp.enabled,
        verified: !!user.twoFA.twoFAMethods.totp?.verified,
        createdAt: user.twoFA.twoFAMethods.totp.createdAt,
        lastUsedAt: user.twoFA.twoFAMethods.totp.lastUsedAt,
        canReset: true
    });
};

export const addTotpHandler = async (req, res) => {
    const { user, hashedToken } = req.auth;

    if (user.twoFA.twoFAMethods.totp?.enabled) {
        return sendResponse(res, 401, "Authenticator Already setup");
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = `otpauth://totp/DevTinder:${user.email}
?secret=${secret}
&issuer=DevTinder
&algorithm=SHA1
&digits=6
&period=30`;

    const qr = await QRCode.toDataURL(otpauthUrl);

    await updateUser(
        user._id,
        {
            "twoFA.twoFAMethods.totp": {
                enabled: true,
                verified: false,
                secret,
                createdAt: new Date()
            }
        },
        {
            id: true
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, {
        message: "Totp authenticator added successfully",
        qr,
        secret
    });
};

export const renewTotpHandler = async (req, res) => {
    const { user, hashedToken } = req.auth;

    if (!user.twoFA.twoFAMethods.totp?.enabled) {
        return sendResponse(
            res,
            403,
            "Totp authenticator is not enabled in this account first enable it"
        );
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = `otpauth://totp/DevTinder:${user.email}
?secret=${secret}
&issuer=DevTinder
&algorithm=SHA1
&digits=6
&period=30`;

    const qr = await QRCode.toDataURL(otpauthUrl);

    await updateUser(
        user._id,
        {
            "twoFA.twoFAMethods.totp": {
                enabled: true,
                verified: false,
                secret,
                createdAt: new Date()
            }
        },
        {
            id: true
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, {
        message: "Totp authenticator renew successfully",
        qr,
        secret
    });
};

export const deleteTotpHandler = async (req, res) => {
    const { user, hashedToken } = req.auth;

    if (!user.twoFA.twoFAMethods.totp?.enabled) {
        return sendResponse(
            res,
            403,
            "Totp authenticator is not enabled in this account first enable it"
        );
    }

    await updateUser(
        user._id,
        {
            "twoFA.twoFAMethods.totp": {
                enabled: false,
                createdAt: null
            }
        },
        {
            id: true
        }
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, {
        message: "Totp authenticator deleted successfully"
    });
};
