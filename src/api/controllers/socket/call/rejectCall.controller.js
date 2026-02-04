import Call from "../.././../../models/Call.model.js";

export const rejectCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const call = await Call.findOneAndUpdate(
            {
                _id: callId,
                receiverId: currentProfile._id,
                chatId: chatInfo._id,
                status: { $in: ["ringing", "calling"] }
            },
            {
                status: "rejected",
                endedAt: new Date(),
                endReason: "rejected"
            },
            { new: true }
        );

        if (!call) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUND",
                message: "Call not found or already ended"
            });
        }

        socket.nsp.to(`user:${call.callerId}`).emit("call:rejected", {
            callId,
            by: currentProfile._id
        });

        return ack?.({
            success: true
        });
    };

export const endCall =
    socket =>
    async ({ reason, callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const call = await Call.findOne({
            _id: callId,
            chatId: chatInfo._id,
            status: "ongoing"
        });

        if (!call) {
            return ack?.({
                success: false,
                code: "CALL_NOT_FOUND",
                message: "Call not found or already ended"
            });
        }

        const endTime = new Date();
        const startTime = new Date(call.startedAt);
        const durationInSeconds = Math.floor((endTime - startTime) / 1000);

        call.status = "ended";
        call.endedAt = endTime;
        call.duration = durationInSeconds;
        call.endReason = reason || "network";

        await call.save();

        const callRoom = `call:${call._id}`;

        socket.nsp.to(callRoom).emit("call:ended", {
            callId,
            by: currentProfile._id,
            duration: durationInSeconds
        });

        socket.nsp.socketsLeave(callRoom);

        return ack?.({
            success: true
        });
    };

export const cancelCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile } = socket.user;

        const call = await Call.findOneAndUpdate(
            {
                _id: callId,
                callerId: currentProfile._id,
                status: { $in: ["calling", "ringing"] }
            },
            {
                status: "missed",
                endedAt: new Date(),
                endReason: "hangup"
            },
            { new: true }
        );

        if (!call) {
            return ack?.({
                success: false,
                message: "Call not found or already processed"
            });
        }

        socket.nsp.to(`user:${call.receiverId}`).emit("call:cancelled", {
            callId,
            by: currentProfile._id
        });

        return ack?.({
            success: true
        });
    };
