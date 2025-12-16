import { setSession } from "../../services/session.service.js";
import { findPushSubscription } from "../../services/pushSubscription.service.js";
import { sendNotification } from "../../helpers/sendNotification.js";

export const sendSessionApproval = async (deviceInfo, user) => {
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
        message: "session approval request send ssuccessfully to login devices",
        approvalId,
        route: "/auth/login/confirm/"
    };
};
