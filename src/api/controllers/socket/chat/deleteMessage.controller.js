import mongoose from "mongoose";

import Message from "../.././../../models/Message.model.js";

export const deleteRealTimeMessage =
    socket =>
    async ({ messageId, mode }, ack) => {
        const { currentProfile } = socket.user;
        const chatId = socket.data.chatId;

        if (!chatId) {
            return ack?.({
                success: false,
                message: "Chat id is not intilized try again"
            });
        }

        const allowedModes = ["me", "everyone"];

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return ack?.({
                success: false,
                code: "INVALID_MESSAGE_ID",
                message: "Invalid message id format"
            });
        }

        if (!allowedModes.includes(mode)) {
            return ack?.({
                success: false,
                code: "INVALID_DELETE_MODE",
                message: "Delete mode must be 'me' or 'everyone'"
            });
        }

        const message = await Message.findOne({ _id: messageId });

        if (!message) {
            return ack?.({
                success: false,
                code: "NOT_FOUND",
                message: "Message not found"
            });
        }

        if (
            mode === "everyone" &&
            String(message.senderId) !== String(currentProfile._id)
        ) {
            return ack?.({
                success: false,
                code: "DELETE_NOT_ALLOWED",
                message: "You can delete this message only for yourself",
                action: "USE_DELETE_FOR_ME",
                status: 403
            });
        }

        const updatePayload =
            mode === "everyone"
                ? {
                      text: null,
                      media: null,
                      deletedForEveryoneAt: new Date()
                  }
                : {
                      $push: {
                          deletedFor: {
                              userId: currentProfile._id,
                              deletedAt: new Date()
                          }
                      }
                  };

        await Message.findByIdAndUpdate(message._id, updatePayload, {
            new: true
        });

        const payload = {
            type: "MESSAGE_DELETED",
            messageId: message._id,
            deleterId: currentProfile._id,
            mode
        };

        socket.nsp.to(`chat:${chatId}`).emit("chat:update", payload);

        return ack?.({
            success: true,
            message: "Message deleted"
        });
    };
