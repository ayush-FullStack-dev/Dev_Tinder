import webpush from "web-push";
import crypto from "crypto";

import { deletePushSubscription } from "../services/pushSubscription.service.js";

export const sendNotification = async (subscription, data) => {
    const notificationId = crypto.randomBytes(10).toString("hex");

    const payload = JSON.stringify({
        ...data,
        notificationId
    });

    try {
        await webpush.sendNotification(subscription, payload);
        return {
            success: true,
            notificationId
        };
    } catch (err) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
            await deletePushSubscription({
                _id: subscription._id
            });
        }

        return {
            success: false,
            error: err?.statusCode || "PUSH_FAILED"
        };
    }
};
