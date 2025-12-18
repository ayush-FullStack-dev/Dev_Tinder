import { setSession } from "../../services/session.service.js";
import { findPushSubscription } from "../../services/pushSubscription.service.js";
import { sendNotification } from "../../helpers/sendNotification.js";

export const sendSessionApproval = async (
    deviceInfo,
    user,
    route = "/auth/login/confirm/"
) => {
    const approvalId = crypto.randomBytes(16).toString("hex");
    await setSession(
        {
            userId: user._id,
            ctxId,
            status: "pending",
            ...deviceInfo
        },
        approvalId,
        `approval`,
        "EX",
        120
    );

    const pushSubscription = await findPushSubscription({
        userId: _id
    });

    await sendNotification(pushSubscription, {
        type: "LOGIN_APPROVAL",
        approvalId,
        title: "New sign-in attempt",
        body: `${deviceInfo.deviceName} • ${deviceInfo.location}`
    });

    return {
        message: "session approval request send successfully to login devices",
        approvalId,
        route
    };
};

export const checkSessionApproval = approval => {
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
