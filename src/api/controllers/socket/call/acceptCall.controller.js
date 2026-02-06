import Call from "../.././../../models/Call.model.js";
import Profile from "../.././../../models/Profile.model.js";

export const acceptCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;

        const opponentId = chatInfo.settings.find(
            k => String(k.userId) !== String(currentProfile._id)
        ).userId;

        const callerProfile = await Profile.findById(opponentId);

        if (!callerProfile) {
            return ack?.({
                success: false,
                code: "CALLER_NOT_AVAILABLE",
                message: "Caller is no longer available",
                action: "END_CALL",
                retry: false
            });
        }

        const call = await Call.findOneAndUpdate(
            {
                _id: callId,
                receiverId: currentProfile._id,
                chatId: chatInfo._id,
                status: { $in: ["ringing", "calling"] }
            },
            [
                {
                    $set: {
                        status: "ongoing",
                        startedAt: new Date(),
                        _flushedIce: "$iceBuffer",
                        iceBuffer: []
                    }
                }
            ],
            { new: true, updatePipeline: true }
        );

        if (!call) {
            return ack?.({
                success: false,
                code: "CALL_EXPIRED",
                message: "Call already handled on another device or expired",
                action: "CLOSE_SCREEN"
            });
        }

        const callRoom = `call:${call._id}`;
        socket.join(callRoom);

        const io = socket.nsp;
        io.in(`user:${call.callerId}`).socketsJoin(callRoom);

        socket.data = { ...socket.data, callId: call._id };

        socket.nsp.to(`user:${call.callerId}`).emit("call:accepted", {
            callId: call._id,
            chatId: call.chatId,
            receiver: {
                userId: currentProfile._id,
                name: currentProfile.displayName,
                photo: currentProfile.primaryPhoto.url
            },
            caller: {
                userId: callerProfile._id,
                name: callerProfile.displayName,
                photo: callerProfile.primaryPhoto.url
            }
        });

        if (call._flushedIce?.length) {
            socket.nsp.to(callRoom).emit("call:signal", {
                type: "ice-batch",
                data: call._flushedIce
            });
        }

        return ack?.({
            success: true,
            code: "CALL_ACCEPTED",
            message: "Call accepted",
            call: {
                callId: call._id,
                chatId: call.chatId,
                room: callRoom,
                role: "receiver"
            },
            startWebRTC: true
        });
    };
