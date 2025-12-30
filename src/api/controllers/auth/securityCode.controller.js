import crypto from "crypto";
import sendResponse from "../../../helpers/sendResponse.js";

import { setSession, cleanupMfa } from "../../../services/session.service.js";
import { createAuthEvent } from "../../../services/authEvent.service.js";
import { buildAuthInfo } from "../../../helpers/authEvent.js";

export const createSecurtyCode = async (req, res) => {
    const { user, hashedToken, risk, device, verifyInfo } = req.auth;
    const keyInfo = {
        userId: user._id,
        issuedByDevice: req.body.deviceId,
        verified: true,
        expiresAt: 900
    };

    const firstCode = crypto.randomBytes(5).toString("hex");
    const secondCode = crypto.randomBytes(5).toString("hex");
    const firstHash = crypto
        .createHash("sha256")
        .update(firstCode)
        .digest("hex");
    const secondHash = crypto
        .createHash("sha256")
        .update(secondCode)
        .digest("hex");

    await setSession(
        {
            ...keyInfo,
            securitycode: secondHash
        },
        firstHash,
        "securitycode:login",
        "EX",
        keyInfo.expiresAt
    );

    await setSession(
        {
            ...keyInfo,
            securitycode: firstHash
        },
        secondHash,
        "securitycode:login",
        "EX",
        keyInfo.expiresAt
    );
     await cleanupMfa(hashedToken);

    await createAuthEvent(
        await buildAuthInfo(device, verifyInfo, {
            _id: user._id,
            eventType: "mfa_manage",
            success: true,
            action: "create_securtycode",
            risk: risk
        })
    );

    return sendResponse(res, 200, {
        message: "Security Code created successfully",
        codes: [firstCode, secondCode]
    });
};
