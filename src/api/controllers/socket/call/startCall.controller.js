import Call from "../.././../../models/Call.model.js";
import Profile from "../.././../../models/Profile.model.js";

import { ringtone } from "../../../../constants/call.constant.js";
import { buildSubscriptionInfo } from "../../../../helpers/premium.helper.js";

const cleanupHandler = (socket, callId, opponentId) => async () => {
    const updated = await Call.findOneAndUpdate(
        {
            _id: callId,
            status: {
                $in: ["calling", "ringing"]
            }
        },
        {
            status: "missed",
            endedAt: new Date(),
            endReason: "missed"
        },
        { new: true }
    );

    if (updated) {
        socket.nsp.to(`user:${opponentId}`).emit("call:missed", {
            callId
        });
    }
};

export const startCall = async ({ callType, socket, chatId }, ack) => {
    const { currentProfile, chatInfo } = socket.user;

    if (!chatId) {
        return ack?.({
            success: false,
            message: "Chat id is not intilized try again"
        });
    }

    const opponentId = chatInfo.settings.find(
        k => String(k.userId) !== String(currentProfile._id)
    ).userId;

    const receiverProfile = await Profile.findById(opponentId);

    if (!receiverProfile) {
        return ack?.({
            success: false,
            code: "RECEIVER_NOT_AVAILABLE",
            message: "Receiver is no longer available",
            action: "END_CALL",
            retry: false
        });
    }

    const isPremium = buildSubscriptionInfo(receiverProfile.premium).isActive;

    const incomingTone =
        isPremium &&
        receiverProfile.premium.features?.ringtone.incoming?.enabled
            ? receiverProfile.premium.features?.ringtone.incoming?.url
            : ringtone.incoming;

    const isOnline = socket.adapter.rooms.has(`user:${opponentId}`);

    const ongoingCall = await Call.findOne({
        chatId,
        status: { $in: ["calling", "ringing", "ongoing"] }
    });

    if (ongoingCall) {
        return ack?.({
            success: false,
            code: "CALL_ALREADY_ACTIVE",
            message: "Call already in progress"
        });
    }

    const call = await Call.create({
        chatId,
        callerId: currentProfile._id,
        receiverId: opponentId,
        type: callType,
        status: isOnline ? "ringing" : "calling"
    });

    socket.to(`user:${opponentId}`).emit("call:incoming", {
        callId: call._id,
        chatId,
        type: call.type,
        caller: {
            userId: currentProfile._id,
            name: currentProfile.displayName,
            photo: currentProfile.primaryPhoto
        },
        incomingTone
    });

    setTimeout(cleanupHandler(socket, call._id, opponentId), 60000);

    return ack?.({
        success: true,
        call: {
            callId: call._id,
            status: call.status,
            type: call.type,
            timeout: 60
        }
    });
};

export const startVoiceCall =
    socket =>
    async ({ chatId }, ack) => {
        return startCall({ callType: "voice", socket, chatId }, ack);
    };

export const startVideoCall =
    socket =>
    async ({ chatId }, ack) => {
        return startCall({ callType: "video", socket, chatId }, ack);
    };
