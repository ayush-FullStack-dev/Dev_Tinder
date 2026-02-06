import Call from "../.././../../models/Call.model.js";
import redis from "../.././../../config/redis.js";

import { endCall } from "./rejectCall.controller.js";

export const muteCall =
    socket =>
    async (...args) => {
        const { currentProfile, chatInfo } = socket.user;
        const { isMuted, callId } = args[0];

        const ack =
            typeof args[args.length - 1] === "function"
                ? args[args.length - 1]
                : null;

        const call = await Call.findOne({
            _id: callId,
            chatId: chatInfo._id,
            status: "ongoing"
        });

        if (!call) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUMD",
                message: "Call not found"
            });
        }

        const callRoom = `call:${call._id}`;

        socket.to(callRoom).emit("call:mute-toggled", {
            userId: currentProfile._id,
            isMuted
        });

        return ack?.({
            success: true
        });
    };

export const videoCall =
    socket =>
    async ({ callId, isVideoOff }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const call = await Call.findOne({
            _id: callId,
            chatId: chatInfo._id,
            status: "ongoing"
        });

        if (!call) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUMD",
                message: "Call not found"
            });
        }

        const callRoom = `call:${call._id}`;

        socket.data.isVideoOff = isVideoOff;

        socket.to(callRoom).emit("call:video-toggled", {
            userId: currentProfile._id,
            isVideoOff
        });

        return ack?.({
            success: true
        });
    };

export const handleDisconnect = socket => async () => {
    const { currentProfile, chatInfo } = socket.user;
    const callId = socket.data?.callId;

    if (!callId) {
        return;
    }

    const call = await Call.findOne({
        _id: callId,
        chatId: chatInfo._id,
        status: "ongoing"
    });

    if (!call) {
        socket.data = { ...socket.data, callId: null };
        return;
    }

    await redis.hset(`call:${call._id}`, {
        status: "ongoing",
        callerId: call.callerId.toString(),
        receiverId: call.receiverId.toString(),
        disconnectedUserId: currentProfile._id.toString(),
        disconnectAt: new Date()
    });

    await redis.expire(`call:${call._id}`, 3600);

    const callRoom = `call:${call._id}`;

    socket.to(callRoom).emit("call:peer:disconnected", {
        callId: call._id,
        userId: currentProfile._id,
        reason: "network",
        gracePeriod: 20,
        canReconnect: true,
        at: new Date()
    });

    setTimeout(async () => {
        const disconnectInfo = await redis.hgetall(`call:${call._id}`);

        if (!disconnectInfo || Object.keys(disconnectInfo).length === 0) return;

        const callHandler = endCall(socket);

        await redis.del(`call:${call._id}`);

        await callHandler(
            {
                reason: "network",
                callId: call._id
            },
            () => {}
        );
    }, 20 * 1000);
};
