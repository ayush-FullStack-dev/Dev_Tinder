import Call from "../.././../../models/Call.model.js";
import Profile from "../.././../../models/Profile.model.js";

import redis from "../.././../../config/redis.js";

export const callSignal = socket => async (payload, ack) => {
    const { currentProfile, chatInfo } = socket.user;
    const { callId } = payload;

    const call = await Call.findOne({
        _id: callId,
        chatId: chatInfo._id,
        status: { $in: ["calling", "ringing", "ongoing"] }
    });

    if (!call) {
        return ack?.({
            success: false,
            code: "CALL_NOT_FOUND",
            message: "Call not found or not active"
        });
    }

    if (call.status === "ongoing") {
        socket.to(`call:${call._id}`).emit("call:signal", payload);
    } else {
        if (payload.type === "ice") {
            await Call.findByIdAndUpdate(callId, {
                $push: { iceBuffer: payload.data }
            });

            return ack?.({
                success: true,
                buffered: true
            });
        }

        const opponentId =
            String(call.callerId) === String(currentProfile._id)
                ? call.receiverId
                : call.callerId;

        socket.nsp.to(`user:${opponentId}`).emit("call:signal", payload);
    }

    return ack?.({ success: true });
};
