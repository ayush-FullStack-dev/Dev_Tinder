import crypto from "crypto";

import { setSession, getSession } from "../../services/session.service.js";
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

    for (const trustedDevice of user.trustedDevices) {
        const pushSubscription = await findPushSubscription({
            deviceIdHash: trustedDevice?.deviceIdHash
        });

        const isSendFcm = await sendNotification(pushSubscription, {
            type: "LOGIN_APPROVAL",
            title: "New sign-in attempt",
            body: `${deviceInfo.deviceName} • ${deviceInfo.location}`,
            tag: "login-alert",
            userId: user.id,
            url: `${process.extra.DOMAIN_LINK}/auth/account/approve-login/${approvalId}`
        });
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
