import sendResponse from "../../../helpers/sendResponse.js";

import { compareNoSaltHash } from "../../../helpers/hash.js";
import { buildAuthInfo } from "../../../helpers/authEvent.js";

import { updateUser } from "../../../services/user.service.js";
import { cleanupMfa } from "../../../services/session.service.js";
import { createAuthEvent } from "../../../services/authEvent.service.js";

export const getAllTrustedDevice = (req, res) => {
    const { user } = req.auth;
    const devices = [];

    for (const device of user.trustedDevices) {
        devices.push({
            sessionId: device.id,
            name: device.name,
            platform: device.platform,
            location: device.location,
            model: device.model,
            country: device.country,
            trustScore: device.trustScore,
            firstTrustedAt: device.createdAt
        });
    }
    return sendResponse(res, 200, {
        devices
    });
};

export const revokeTrustedDevice = async (req, res) => {
    const { user, hashedToken, risk, device, verifyInfo } = req.auth;

    if (!req.body?.sessionId) {
        return sendResponse(
            res,
            400,
            "sessionId is required to revoke a trusted device."
        );
    }

    const index = user.trustedDevices.findIndex(
        k => k.id === req.body.sessionId
    );

    if (index === -1) {
        return sendResponse(
            res,
            404,
            "The specified trusted device was not found."
        );
    }

    const currentTrust = compareNoSaltHash(
        device.deviceId,
        user.trustedDevices[index].deviceIdHash
    );

    if (currentTrust) {
        return sendResponse(
            res,
            409,
            "You cannot revoke the trusted status of the device you are currently using."
        );
    }

    user.trustedDevices.splice(index, 1);

    await updateUser(
        {
            _id: user._id
        },
        {
            trustedDevices: user.trustedDevices
        }
    );

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "revoke_trustDevice",
            risk: risk
        })
    );

    await cleanupMfa(hashedToken);

    return sendResponse(res, 200, {
        message: "Trusted device revoked successfully."
    });
};
