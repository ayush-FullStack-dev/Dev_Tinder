import Chat from "../.././../../models/Chat.model.js";
import Call from "../.././../../models/Call.model.js";
import Message from "../.././../../models/Message.model.js";
import Profile from "../.././../../models/Profile.model.js";

import { ringtone, busy } from "../../../../constants/call.constant.js";
import { buildSubscriptionInfo } from "../../../../helpers/premium.helper.js";
import {
    getMessagePayload,
    updateLastMessageCall
} from "../../../../helpers/chat/message.helper.js";
import { getIO } from "../../../../../socket.js";

const cleanupHandler = (socket, callId, isOnline) => async () => {
    const io = getIO();

    const updatedCall = await Call.findOneAndUpdate(
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

    if (!updatedCall) {
        return;
    }

    await redis.del(`call:${callId}`);

    socket.to(`user:${updatedCall.receiverId}`).emit("call:missed", {
        callId
    });

    socket.nsp.to(`user:${updatedCall.callerId}`).emit("call:missed", {
        callId
    });

    const message = await Message.create({
        chatId: updatedCall.chatId,
        senderId: updatedCall.callerId,
        type: "system",
        system: {
            event: "call",
            call: {
                callId,
                type: updatedCall.type,
                callerId: updatedCall.callerId,
                status: "missed"
            }
        },
        deliveredTo: isOnline
            ? {
                  userId: updatedCall.receiverId,
                  deliveredAt: new Date()
              }
            : null
    });

    const messagePayload = getMessagePayload(message, updatedCall.callerId);

    io.of("/chat").to(`chat:${updatedCall.chatId}`).emit("chat:newMessage", {
        success: true,
        data: messagePayload
    });

    await updateLastMessageCall(
        io,
        updatedCall.callerId,
        updatedCall.chatId,
        message
    );
};

export const startCall = async ({ callType, socket }, ack) => {
    const { currentProfile, chatInfo } = socket.user;
    const chatId = chatInfo._id;

    if (!chatId) {
        return ack?.({
            success: false,
            message: "Chat id is not intilized try again"
        });
    }

    const opponentId = chatInfo.users.find(
        k => String(k) !== String(currentProfile._id)
    );

    const ongoingCall = await Call.countDocuments({
        $or: [{ callerId: opponentId }, { receiverId: opponentId }],
        status: "ongoing"
    });

    const isBusy = ongoingCall >= 1;
    let incomingTone = busy.incoming;
    let rinbackTone = busy.ringBack;

    if (!isBusy) {
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

        const isPremium = buildSubscriptionInfo(
            receiverProfile.premium
        ).isActive;

        incomingTone =
            isPremium &&
            receiverProfile.premium.features.ringtone?.incoming?.enabled
                ? receiverProfile.premium.features.ringtone.incoming?.url
                : ringtone.incoming;

        rinbackTone =
            isPremium &&
            receiverProfile.premium.features.ringtone?.ringback?.enabled
                ? receiverProfile.premium.features.ringtone.ringback?.url
                : ringtone.ringBack;
    }

    const isOnline = socket.adapter.rooms.has(`user:${opponentId}`);

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
            photo: currentProfile.primaryPhoto.url
        },
        isBusy,
        incomingTone
    });

    setTimeout(
        cleanupHandler(socket, call._id, isOnline),
        isBusy ? 15000 : 60000
    );

    return ack?.({
        success: true,
        call: {
            callId: call._id,
            status: call.status,
            type: call.type,
            rinbackTone,
            isBusy,
            timeout: isBusy ? 15 : 60
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
