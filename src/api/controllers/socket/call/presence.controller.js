import Call from "../.././../../models/Call.model.js";
import { tone } from "../../../../constants/call.constant.js";
import redis from "../.././../../models/Profile.model.js";

const toBool = v => v === "true";

export const muteCall =
    socket =>
    async (...args) => {
        const { currentProfile, chatInfo } = socket.user;
        const { callId } = args[0];

        const ack =
            typeof args[args.length - 1] === "function"
                ? args[args.length - 1]
                : null;

        const callInfo = await redis.hgetall(`call:${callId}`);

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
        const nextMute = !toBool(callInfo.mute);

        socket.to(callRoom).emit("call:mute-toggled", {
            userId: currentProfile._id,
            isMuted: nextMute
        });

        await redis.hset(`call:${callId}`, "mute", String(nextMute));

        return ack?.({ success: true });
    };

export const videoCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const callInfo = await redis.hgetall(`call:${callId}`);

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
        const nextVideo = !toBool(callInfo.video);

        socket.to(callRoom).emit("call:video-toggled", {
            userId: currentProfile._id,
            isVideoOff: nextVideo
        });

        await redis.hset(`call:${callId}`, "video", String(nextVideo));

        return ack?.({ success: true });
    };

export const holdCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const callInfo = await redis.hgetall(`call:${callId}`);

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

        if (toBool(callInfo.hold)) {
            return ack?.({
                success: false,
                code: "CALL_ALREADY_HOLD",
                message: "Call hold"
            });
        }

        const callRoom = `call:${callId}`;

        socket.to(callRoom).emit("call:hold", {
            userId: currentProfile._id,
            tone: tone.hold,
            playTone: true
        });

        await redis.hset(`call:${callId}`, "hold", "true");

        return ack?.({ success: true });
    };

export const resumeCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const callInfo = await redis.hgetall(`call:${callId}`);

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

        socket.to(callRoom).emit("call:resume", {
            userId: currentProfile._id,
            playTone: false
        });

        await redis.hset(`call:${callId}`, "hold", "false");

        return ack?.({ success: true });
    };
