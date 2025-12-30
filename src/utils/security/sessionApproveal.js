import crypto from "crypto";

import { setSession } from "../../services/session.service.js";
import { findPushSubscription } from "../../services/pushSubscription.service.js";
import { sendNotification } from "../../helpers/sendNotification.js";

export const sendSessionApproval = async (deviceInfo, user) => {
    const approvalId = crypto.randomBytes(16).toString("hex");
    await setSession(
        {
            userId: user._id,
            status: "pending",
            device: deviceInfo,
            requestedAt: new Date(),
            used: false
        },
        approvalId,
        `session:approval`,
        "EX",
        120
    );

    const alreadySent = [];
    for (const trustedDevice of user.trustedDevices) {
        const pushSubscription = await findPushSubscription({
            deviceIdHash: trustedDevice?.deviceIdHash
        });

        await sendNotification(pushSubscription, {
            type: "LOGIN_APPROVAL",
            title: "New sign-in attempt",
            body: `${deviceInfo.deviceName} • ${deviceInfo.location}`,
            url: `${process.extra.DOMAIN_LINK}/auth/approve-login/${approvalId}`
        });
        alreadySent.push(pushSubscription);
    }

    return {
        approvalId
    };
};

export const checkSessionApproval = (approval, info) => {
    if (approval?.status === "approved") {
        return {
            success: true,
            method: "session_approval",
            stepup: info.risk === "high" || info.risk === "veryhigh"
        };
    }

    if (approval?.status === "declined") {
        return {
            success: false,
            message: "session approval rejected by user",
            method: "session_approval"
        };
    }
};
