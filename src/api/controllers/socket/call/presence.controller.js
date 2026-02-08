import Call from "../.././../../models/Call.model.js";

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
