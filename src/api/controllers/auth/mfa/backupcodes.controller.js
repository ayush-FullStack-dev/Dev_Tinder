import crypto from "crypto";

import sendResponse from "../../../../helpers/sendResponse.js";
import { encryptData, decryptData } from "../../../../helpers/encryption.js";
import { createAuthEvent } from "../../../../services/authEvent.service.js";
import { buildAuthInfo } from "../../../../helpers/authEvent.js";
import { updateUser } from "../../../../services/user.service.js";
import { cleanupMfa } from "../../../../services/session.service.js";

export const activeBackupCodeHandler = async (req, res) => {
    const { user, risk, device, verifyInfo } = req.auth;
    const backupCodes = [];

    if (user.twoFA.twoFAMethods.backupCodes.codes?.length) {
        for (const backupcode of user.twoFA.twoFAMethods.backupCodes.codes) {
            backupCodes.push(
                decryptData(backupcode.iv, backupcode.content, backupcode.tag)
            );
        }
    }

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "get_backupcode",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        enabled: user.twoFA.twoFAMethods.backupCodes.enabled,
        remaining: user.twoFA.twoFAMethods.backupCodes.codes.length,
        createdAt: user.twoFA.twoFAMethods.backupCodes.createdAt,
        codes: backupCodes,
        canRegenerate: true
    });
};

export const addBackupCodeHandler = async (req, res) => {
    const { user, hashedToken, risk, device, verifyInfo } = req.auth;
    const rawCodes = [];
    const backupCodes = {
        enabled: true,
        createdAt: new Date(),
        codes: []
    };

    if (user.twoFA.twoFAMethods.backupCodes.codes.length > 0) {
        return sendResponse(
            res,
            200,
            "Backup code already exists we cannot create again"
        );
    }

    for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString("hex");
        rawCodes.push(code);
        backupCodes.codes.push(encryptData(code));
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.backupCodes": backupCodes
        }
    );

    await cleanupMfa(hashedToken);

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "enable_backupcode",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        message: "Backup code is generated",
        info: { enabled: true, createdAt: Date.now(), codes: rawCodes }
    });
};

export const renewBackupCodeHandler = async (req, res) => {
    const { user, hashedToken, risk, device, verifyInfo } = req.auth;
    const rawCodes = [];
    const backupCodes = {
        enabled: true,
        createdAt: Date.now(),
        renew: true,
        codes: []
    };

    if (user.twoFA.twoFAMethods.backupCodes.codes.length === 0) {
        return sendResponse(
            res,
            403,
            "Backup code not exists we cannot renew it"
        );
    }

    for (let i = 0; i < 10; i++) {
        const code = crypto.randomBytes(4).toString("hex");
        rawCodes.push(code);
        backupCodes.codes.push(encryptData(code));
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.backupCodes": backupCodes
        }
    );

    await cleanupMfa(hashedToken);

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "renew_backupcode",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        message: "Backup code is regenerated",
        info: {
            enabled: true,
            regenerate: true,
            createdAt: Date.now(),
            codes: rawCodes
        }
    });
};

export const deleteBackupCodeHandler = async (req, res) => {
    const { user, hashedToken, risk, device, verifyInfo } = req.auth;
    const backupCodes = {
        enabled: false,
        codes: []
    };

    if (user.twoFA.twoFAMethods.backupCodes.codes.length === 0) {
        return sendResponse(
            res,
            403,
            "Backup code not exists we cannot delete it"
        );
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            "twoFA.twoFAMethods.backupCodes": backupCodes
        }
    );

    await cleanupMfa(hashedToken);

    await createAuthEvent(
        await buildAuthInfo(deviceInfo, verify, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "delete_backupcode",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        message: "Backup code is deleted",
        info: {
            enabled: false,
            deletedAt: Date.now()
        }
    });
};
