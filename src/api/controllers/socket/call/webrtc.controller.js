import Call from "../.././../../models/Call.model.js";
import Profile from "../.././../../models/Profile.model.js";

export const callSignal = socket => async (payload, ack) => {
    const { currentProfile, chatInfo } = socket.user;

    const callId = payload.callId;

    const call = await Call.findOne({
        _id: callId,
        chatId: chatInfo._id,
        status: "ongoing"
    });

    if (!call) {
        return ack?.({
            success: false,
            code: "CALL_NOT_FOUMD",
            message: "Call not found or not active"
        });
    }

    const callRoom = `call:${call._id}`;

    socket.to(callRoom).emit("call:signal", payload);

    return ack?.({ success: true });
};
