import Message from "../.././../../models/Message.model.js";
import Chat from "../../../../models/Chat.model.js";

import { newMessageValidator } from "../../../../validators/user/chat/newMessage.validator.js";

import { prettyErrorResponse } from "../../../../helpers/ApiError.js";

export const sendRealTimeMessage = socket => async (payload, ack) => {
    const { currentProfile, chatInfo } = socket.user;
    const chatId = socket.data?.chatId;

    if (!chatId) {
        return ack?.({
            success: false,
            message: "Chat id is not intilized try again"
        });
    }

    const validate = newMessageValidator.validate(payload);
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

    const opponentId = chatInfo.settings.find(
        k => String(k.userId) !== String(currentProfile._id)
    ).userId;

    const isOnline = socket.adapter.rooms.has(`user:${opponentId}`);

    const message = await Message.create({
        chatId,
        senderId: socket.user.currentProfile._id,
        type: value.type,
        text: value.text,
        media: value.media?.url ? value.media : null,
        replyTo: value.replyTo,
        deliveredTo: isOnline
            ? {
                  userId: chatInfo.users.find(n => n !== currentProfile._id),
                  deliveredAt: new Date()
              }
            : null
    });

    const updatedChatInfo = await Chat.findOneAndUpdate(
        {
            _id: chatId,
            status: "active"
        },
        {
            $set: {
                lastMessage: {
                    type: message.type,
                    text: message.text,
                    senderId: message.senderId,
                    sentAt: message.createdAt
                },
                lastMessageAt: new Date()
            },
            $inc: {
                "settings.$[op].unreadCount": 1
            }
        },
        {
            arrayFilters: [{ "op.userId": opponentId }],
            new: true
        }
    );

    const messagePayload = {
        messageId: message._id,
        type: message.type,
        text: message.text,
        senderId: currentProfile?._id,
        media:
            message.type !== "text" && message.media.url
                ? {
                      url: message.media.url,
                      key: message.media.key,
                      mimeType: message.media.mimeType,
                      size: message.media.size,
                      duration: message.media.duration,
                      width: message.media.width,
                      height: message.media.height
                  }
                : null,
        replyTo: message.replyTo,
        deleted: {
            forEveryone: false
        },
        timestamps: {
            sentAt: message.createdAt,
            deliveredAt: message.deliveredTo?.deliveredAt || null,
            readAt: null
        },
        status: message.deliveredTo?.deliveredAt ? "delivered" : "sent"
    };

    socket.to(`chat:${chatId}`).emit("chat:newMessage", {
        success: true,
        data: messagePayload
    });

    const baseListInfo = {
        chatId: updatedChatInfo._id,
        lastMessage: {
            type: updatedChatInfo.lastMessage.type,
            text: updatedChatInfo.lastMessage.text,
            senderId: updatedChatInfo.lastMessage.senderId,
            sentAt: updatedChatInfo.lastMessage.createdAt,
            status: messagePayload.status
        },
        lastMessageAt: updatedChatInfo.lastMessageAt,
        moveToTop: true
    };

    const chats = await Chat.find({ users: currentProfile._id }).select(
        "users"
    );

    socket.to(`user:${opponentId}`).emit("chat:list:update", {
        ...baseListInfo,
        unreadCount: updatedChatInfo.settings.find(
            k => String(k.userId) !== String(currentProfile._id)
        ).unreadCount,
        sender: "opponent"
    });

    socket.to(`user:${currentProfile._id}`).emit("chat:list:update", {
        ...baseListInfo,
        unreadCount: updatedChatInfo.settings.find(
            k => String(k.userId) === String(currentProfile._id)
        ).unreadCount,
        sender: "me"
    });

    socket.emit("chat:messageSent", {
        success: true,
        data: messagePayload
    });

    return ack?.({ success: true, message: "Message sent" });
};
