import Call from "../.././../../models/Call.model.js";
import Message from "../.././../../models/Message.model.js";
import {
    getMessagePayload,
    updateLastMessageCall
} from "../../../../helpers/chat/message.helper.js";

import { getIO } from "../../../../../socket.js";

export const rejectCall =
    socket =>
    async ({ callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;
        const io = getIO();

        const call = await Call.findOneAndUpdate(
            {
                _id: callId,
                receiverId: currentProfile._id,
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

        const message = await Message.create({
            chatId: chatInfo._id,
            senderId: call.callerId,
            type: "system",
            system: {
                event: "call",
                call: {
                    callId: call._id,
                    type: call.type,
                    callerId: call.callerId,
                    status: "rejected"
                }
            },
            deliveredTo: {
                userId: currentProfile._id,
                deliveredAt: new Date()
            }
        });

        const messagePayload = getMessagePayload(message, currentProfile);

        io.of("/chat").to(`chat:${chatInfo._id}`).emit("chat:newMessage", {
            success: true,
            data: messagePayload
        });

        await updateLastMessageCall(io, call.callerId, chatInfo._id, message);

        return ack?.({
            success: true
        });
    };

export const endCall =
    socket =>
    async (...args) => {
        const io = getIO();

        const { reason, callId } = args[0];

        const ack =
            typeof args[args.length - 1] === "function"
                ? args[args.length - 1]
                : null;

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

        const res = await call.save();

        const callRoom = `call:${call._id}`;

        io.of("/call").to(callRoom).emit("call:ended", {
            callId: call._id,
            by: currentProfile._id,
            duration: durationInSeconds
        });

        const message = await Message.create({
            chatId: chatInfo._id,
            senderId: call.callerId,
            type: "system",
            system: {
                event: "call",
                call: {
                    callId: call._id,
                    type: call.type,
                    callerId: call.callerId,
                    status: "ended",
                    duration: durationInSeconds
                }
            },
            deliveredTo: {
                userId: currentProfile._id,
                deliveredAt: new Date()
            }
        });

        const messagePayload = getMessagePayload(message, currentProfile);

        io.of("/chat").to(`chat:${chatInfo._id}`).emit("chat:newMessage", {
            success: true,
            data: messagePayload
        });

        updateLastMessageCall(io, call.callerId, chatInfo._id, message);

        return ack?.({
            success: true
        });
    };

export const cancelCall =
    socket =>
    async ({ reason, callId }, ack) => {
        const { currentProfile, chatInfo } = socket.user;
        const io = getIO();

        const call = await Call.findOneAndUpdate(
            {
                _id: callId,
                callerId: currentProfile._id,
                status: { $in: ["calling", "ringing"] }
            },
            {
                status: "missed",
                endedAt: new Date(),
                endReason:reason || "hangup"
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

        const message = await Message.create({
            chatId: chatInfo._id,
            senderId: call.callerId,
            type: "system",
            system: {
                event: "call",
                call: {
                    callId: call._id,
                    type: call.type,
                    callerId: call.callerId,
                    status: "missed"
                }
            },
            deliveredTo: {
                userId: currentProfile._id,
                deliveredAt: new Date()
            }
        });

        const messagePayload = getMessagePayload(message, currentProfile);

        io.of("/chat").to(`chat:${chatInfo._id}`).emit("chat:newMessage", {
            success: true,
            data: messagePayload
        });

        updateLastMessageCall(io, call.callerId, chatInfo._id, message);

        return ack?.({
            success: true
        });
    };
