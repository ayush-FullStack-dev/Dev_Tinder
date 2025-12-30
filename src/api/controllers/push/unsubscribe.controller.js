import sendResponse from "../../../helpers/sendResponse.js";
import { deletePushSubscription } from "../../../services/pushSubscription.service.js";

export const unsubscribePush = async (req, res) => {
    const { user } = req.auth;

    if (req.body?.deviceId) {
        return sendResponse(res, 400, "Invalid push subscriptions deviceId");
    }

    const deviceIdHash = getNoSaltHash(req.body.deviceId);

    const pushSubInfo = await deletePushSubscription({
        deviceIdHash
    });

    return sendResponse(res, 200, {
        message: "Push unsubscribe successfully",
        data: {
            subscribed: false
        }
    });
};
