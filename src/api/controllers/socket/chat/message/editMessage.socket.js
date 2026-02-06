import Message from "../.././../../../models/Message.model.js";
import Chat from "../../../../../models/Chat.model.js";

import { editMessageValidator } from "../../../../../validators/user/chat/newMessage.validator.js";
import { EDIT_WINDOW } from "../../../../../constants/message.constant.js";
import { prettyErrorResponse } from "../../../../../helpers/ApiError.js";
import { getMessagePayload } from "../../../../../helpers/chat/message.helper.js";

export const editRealTimeMessage = socket => async (payload, ack) => {
    const { currentProfile, chatInfo } = socket.user;

    if (!socket.data?.chatId) {
        return ack?.({
            success: false,
            message: "Chat id is not intilized try again"
        });
    }

    const validate = editMessageValidator.validate(payload);
    const value = validate?.value;

    if (validate?.error) {
        const jsonResponse = prettyErrorResponse(
            validate,
            "Invalid message payload"
        );
        return ack?.({
            success: false,
            code: "VALIDATION_ERROR",
            jsonResponse
        });
    }

    const mySetting = chatInfo.settings.find(
        u => String(u.userId) === String(currentProfile._id)
    );

    const query = {
        _id: value.messageId,
        chatId: socket.data.chatId,
        type: "text"
    };

    if (mySetting.deletedAt) {
        query.createdAt = { $gt: mySetting.deletedAt };
    }

    const message = await Message.findOne(query);

    if (!message) {
        return ack?.({
            success: false,
            code: "NOT_FOUND",
            message: "Message not found"
        });
    }

    const isDeletedForMe = message.deletedFor.some(
        d => String(d.userId) === String(currentProfile._id)
    );

    if (message.deletedForEveryoneAt || isDeletedForMe) {
        return ack?.({
            success: false,
            code: "MESSAGE_NOT_EDITABLE",
            message: "This message was deleted and cannot be edited"
        });
    }

    if (String(message.senderId) !== String(currentProfile._id)) {
        return ack?.({
            success: false,
            code: "EDIT_NOT_ALLOWED",
            message: "You can edit only your own messages"
        });
    }

    if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW) {
        return ack?.({
            success: false,
            code: "EDIT_TIME_EXPIRED",
            message: `You can only edit messages within ${
                EDIT_WINDOW - 60 * 1000
            } minutes`
        });
    }

    const opponentId = chatInfo.settings.find(
        k => String(k.userId) !== String(currentProfile._id)
    ).userId;

    const isOnline = socket.adapter.rooms.has(`user:${opponentId}`);

    const updatesMessage = await Message.findByIdAndUpdate(
        message._id,
        {
            text: value.text,

            deliveredTo: isOnline
                ? {
                      userId: opponentId,
                      deliveredAt: new Date()
                  }
                : null,
            readBy: null,
            editedAt: new Date()
        },
        { new: true }
    );

    const messagePayload = getMessagePayload(updatesMessage, currentProfile);

    if (String(chatInfo.lastMessage.messageId) === String(message._id)) {
        const updatedChatInfo = await Chat.findByIdAndUpdate(
            socket.data?.chatId,
            {
                lastMessage: {
                    type: updatesMessage.type,
                    text: updatesMessage.text,
                    senderId: updatesMessage.senderId,
                    messageId: updatesMessage._id,
                    sentAt: updatesMessage.createdAt
                }
            },
            { new: true }
        );

        const baseListInfo = {
            type: "MESSAGE_EDITED",
            chatId: socket.data?.chatId,
            lastMessage: {
                type: updatedChatInfo.lastMessage.type,
                text: updatedChatInfo.lastMessage.text,
                senderId: updatedChatInfo.lastMessage.senderId,
                messageId: updatedChatInfo.lastMessage.messageId,
                sentAt: updatedChatInfo.lastMessage.sentAt,
                status: messagePayload.status
            },
            lastMessageAt: updatedChatInfo.lastMessageAt,
            moveToTop: false
        };

        socket.to(`user:${opponentId}`).emit("chat:list:update", {
            ...baseListInfo,
            sender: "opponent"
        });

        socket.to(`user:${currentProfile._id}`).emit("chat:list:update", {
            ...baseListInfo,
            sender: "me"
        });
    }

    socket.nsp.to(`chat:${socket.data.chatId}`).emit("chat:message:update", {
        success: true,
        type: "MESSAGE_EDITED",
        data: messagePayload
    });

    return ack?.({ success: true, message: "Message sent" });
};
