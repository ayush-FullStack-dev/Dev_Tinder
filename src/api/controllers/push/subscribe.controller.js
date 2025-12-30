import sendResponse from "../../../helpers/sendResponse.js";
import {
    updatePushSubscription,
    findPushSubscription
} from "../../../services/pushSubscription.service.js";

import { updateOrCreateOption } from "../../../constants/mongoose.constant.js";

import { subscribeValidator } from "../../../validators/push/subscribe.validator.js";

import { checkValidation } from "../../../helpers/helpers.js";
import { sendNotification } from "../../../helpers/sendNotification.js";
import { getIpInfo } from "../../../helpers/ip.js";
import { getNoSaltHash } from "../../../helpers/hash.js";
import { buildDeviceInfo } from "../../../helpers/buildDeviceInfo.js";

export const subscribePush = async (req, res) => {
    const { user } = req.auth;

    const validate = checkValidation(
        subscribeValidator,
        req,
        "Invalid push subscription data"
    );

    if (!validate.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    const deviceIdHash = getNoSaltHash(req.body.deviceId);

    const deviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        req.body,
        getIpInfo(req.realIp)
    );

    const pushSubInfo = await updatePushSubscription(
        {
            deviceIdHash
        },
        {
            userId: user._id,
            deviceIdHash,
            endpoint: req.body.subscription.endpoint,
            keys: {
                p256dh: req.body.subscription.keys.p256dh,
                auth: req.body.subscription.keys.auth
            },
            deviceInfo: {
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                userAgent: deviceInfo.userAgent,
                ipCountry: deviceInfo.country,
                ipCity: deviceInfo.city
            }
        },
        {},
        updateOrCreateOption
    );

    return sendResponse(res, 200, {
        message: "Push subscription saved",
        data: {
            subscribed: true
        }
    });
};

