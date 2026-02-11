import Call from "../.././../../models/Call.model.js";
import redis from "../.././../../config/redis.js";

import { endCall, cancelCall } from "./rejectCall.controller.js";

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

    await redis.hset(`call:${call._id}:disconnect`, {
        status: "ongoing",
        callerId: call.callerId.toString(),
        receiverId: call.receiverId.toString(),
        disconnectedUserId: currentProfile._id.toString(),
        disconnectAt: new Date()
    });

    await redis.expire(`call:${call._id}:disconnect`, 3600);

    socket.to(callRoom).emit("call:peer:disconnected", {
        callId: call._id,
        userId: currentProfile._id,
        reason: "network",
        gracePeriod: 20,
        canReconnect: true,
        at: new Date()
    });

    setTimeout(async () => {
        const disconnectInfo = await redis.hgetall(
            `call:${call._id}:disconnect`
        );

        if (!disconnectInfo || Object.keys(disconnectInfo).length === 0) return;

        await redis.del(`call:${call._id}:disconnect`);

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

        await redis.del(`call:${call._id}:disconnect`);

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

export const callQuality =
    socket =>
    async ({ callId, level, rtt, packetLoss }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const callInfo = await redis.hgetall(`call:${callId}`);
        const networkLevel = ["good", "poor", "lost"];

        if (!networkLevel.includes(level)) {
            return ack?.({
                success: false,
                code: "LEVEL_INVALID",
                message: `call quality level must be ${networkLevel.join(" , ")}`
            });
        }

        if (
            !callInfo ||
            (callInfo?.chatId &&
                String(callInfo?.chatId) !== String(chatInfo._id))
        ) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUMD",
                message: "Call not found"
            });
        }

        const callRoom = `call:${callId}`;

        socket.to(callRoom).emit("call:peer:quality", {
            userId: currentProfile._id,
            quality: level,
            rtt,
            packetLoss
        });

        await redis.hset(`call:${callId}:quality`, {
            quality: level,
            rtt,
            packetLoss,
            qualityAt: Date.now()
        });

        await redis.expire(`call:${call._id}:quality`, 3600);

        return ack?.({ success: true });
    };

export const callMediaChange =
    socket =>
    async ({ callId, from, to, reason }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const ALLOWED_MEDIA = ["voice", "video", "screen"];

        if (!callId || !from || !to) {
            return ack?.({
                success: false,
                code: "INVALID_PAYLOAD",
                message: "callId, from and to are required"
            });
        }

        if (!ALLOWED_MEDIA.includes(from) || !ALLOWED_MEDIA.includes(to)) {
            return ack?.({
                success: false,
                code: "INVALID_MEDIA_TYPE",
                message: "Media type must be voice | video | screen"
            });
        }

        if (from === to) {
            return ack?.({
                success: false,
                code: "NO_MEDIA_CHANGE",
                message: "Source and target media are same"
            });
        }

        const callInfo = await redis.hgetall(`call:${callId}`);

        if (
            !callInfo ||
            !callInfo.chatId ||
            String(callInfo.chatId) !== String(chatInfo._id)
        ) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUND",
                message: "Call not found or already ended"
            });
        }

        const callRoom = `call:${callId}`;

        await redis.hset(`call:${callId}:media`, {
            media: to,
            lastMediaChangeAt: Date.now(),
            lastMediaReason: reason || "manual"
        });

        await redis.expire(`call:${callId}:media`, 3600);

        socket.to(callRoom).emit("call:media:changed", {
            by: currentProfile._id,
            from,
            to,
            reason: reason || "manual",
            at: new Date()
        });

        return ack?.({
            success: true,
            message:
                to === "voice"
                    ? "Call downgraded to voice"
                    : "Call media upgraded",
            media: {
                from,
                to
            }
        });
    };
