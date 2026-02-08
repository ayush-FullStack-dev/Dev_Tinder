import Call from "../.././../../models/Call.model.js";
import redis from "../.././../../config/redis.js";

import { endCall } from "./rejectCall.controller.js";

export const handleDisconnect = socket => async () => {
    const { currentProfile, chatInfo } = socket.user;
    const callId = socket.data?.callId;

    if (!callId) {
        return;
    }

    const call = await Call.findOne({
        _id: callId,
        chatId: chatInfo._id,
        status: {
            $in: ["calling", "ringing", "ongoing"]
        }
    });

    if (!call) {
        socket.data = { ...socket.data, callId: null };
        return;
    }

    const isCalling =
        call.status !== "ongoing" &&
        String(call.callerId) === String(currentProfile._id);

    if (isCalling) {
        const callHandler = cancelCall(socket);
        await callHandler(
            {
                callId: call._id,
                reason: "network"
            },
            () => {}
        );

        return;
    }

    const callRoom = `call:${call._id}`;
    const count = socket.adapter.rooms.get(callRoom)?.size || 0;

    if (count <= 0) {
        const callHandler = endCall(socket);
        await callHandler(
            {
                reason: "network",
                callId: call._id
            },
            () => {}
        );

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

        await redis.del(`call:${call._id}`);

        const callHandler = endCall(socket);
        await callHandler(
            {
                reason: "network",
                callId: call._id
            },
            () => {}
        );
    }, 20 * 1000);
};

export const handleReconnect =
    socket =>
    async (...args) => {
        const { currentProfile, chatInfo } = socket.user;
        const { callId } = args[0];

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
                code: "CALL_NOT_FOUND",
                message: "call not active"
            });
        }

        const callRoom = `call:${call._id}`;

        const count = socket.adapter.rooms.get(callRoom)?.size || 0;

        if (count >= 2) {
            return ack?.({
                success: false,
                code: "CALL_ROOM_FULL",
                message: "Call already active on another device",
                action: "END_CALL",
                retry: false,
                reason: "MULTI_DEVICE_LIMIT"
            });
        }

        socket.join(callRoom);

        await redis.del(callRoom);

        socket.to(callRoom).emit("call:peer:reconnected", {
            callId: call._id,
            userId: currentProfile._id,
            role:
                String(currentProfile._id) === String(call.callerId)
                    ? "caller"
                    : "receiver",
            at: new Date(),
            resume: true
        });

        socket.data = {
            ...socket.data,
            callId: call._id
        };

        return ack?.({
            success: true,
            code: "CALL_RECONNECTED",
            message: "Reconnected to ongoing call",
            call: {
                callId: call._id,
                room: callRoom
            },
            resumeWebRTC: true
        });
    };
