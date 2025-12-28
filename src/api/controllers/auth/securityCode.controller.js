import crypto from "crypto";

import { setSession, cleanupMfa } from "../../../services/session.service.js";

import sendResponse from "../../../helpers/sendResponse.js";

export const createSecurtyCode = async (req, res) => {
    const { user } = req.auth;
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
        .update(firstCode)
        .digest("hex");
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.query?.rpat)
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

    return sendResponse(res, 200, {
        message: "Security Code created successfully",
        codes: [firstCode, secondCode]
    });
};
