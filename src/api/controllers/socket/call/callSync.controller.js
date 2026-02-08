import Call from "../.././../../models/Call.model.js";

import { ringtone } from "../../../../constants/call.constant.js";
import { buildSubscriptionInfo } from "../../../../helpers/premium.helper.js";

export const syncActiveCalls = async socket => {
    const { currentProfile } = socket.user;

    const call = await Call.findOne({
        receiverId: currentProfile._id,
        status: { $in: ["calling", "ringing"] }
    })
        .sort({ createdAt: -1 })
        .populate("callerId", "displayName primaryPhoto");

    if (!call) {
        return;
    }

    const isPremium = buildSubscriptionInfo(currentProfile.premium).isActive;

    const incomingTone =
        isPremium && currentProfile.premium.features.ringtone?.incoming?.enabled
            ? currentProfile.premium.features.ringtone.incoming?.url
            : ringtone.incoming;

    const caller = call.callerId;

    socket.emit("call:incoming", {
        callId: call._id,
        chatId: call.chatId,
        type: call.type,
        caller: {
            userId: caller._id,
            name: caller.displayName,
            photo: caller.primaryPhoto.url
        },
        incomingTone
    });
};
