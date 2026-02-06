import sendResponse from "../../../../helpers/sendResponse.js";
import Chat from "../../../../models/Chat.model.js";
import mongoose from "mongoose";

import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const getChats = async (req, res) => {
    const { currentProfile } = req.auth;

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query = {
        users: currentProfile._id
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.lastMessageAt = { $lt: new Date(req.query.cursor) };
    }

    const chats = await Chat.find(query)
        .sort({ lastMessageAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate("users", "username displayName primaryPhoto");

    const { pagination, info: chatsInfo } = paginationInfos(
        chats,
        limit,
        "lastMessageAt"
    );

    const response = {
        message: "All chats fetched successfull",
        chats: [],
        pagination
    };

    for (const chat of chatsInfo) {
        let lastMessage = {
            text: null,
            type: null,
            sender: null,
            messageId: null,
            sentAt: null
        };

        const opponent = chat.users.find(
            k => String(k) !== String(currentProfile._id)
        );

        const mySetting = chat.settings.find(
            k => String(k.userId) === String(currentProfile._id)
        );

        if (chat.lastMessage.sentAt > mySetting.deletedAt) {
            lastMessage = {
                text: chat.lastMessage.text,
                type: chat.lastMessage.type,
                sender: chat.lastMessage.senderId,
                messageId: chat.lastMessage.messageId,
                sentAt: chat.lastMessage.sentAt
            };
        }

        response.chats.push({
            chatId: chat._id,
            matchId: chat.matchId,
            opponent: {
                username: opponent.username,
                displayName: opponent.displayName,
                primaryPhoto: {
                    url: opponent.primaryPhoto.url
                }
            },
            lastMessage,
            lastMessageAt:
                chat.lastMessage.sentAt > mySetting.deletedAt
                    ? chat.lastMessageAt
                    : null,
            unreadCount: mySetting.unreadCount,
            isPinned: mySetting.pinned,
            isMuted: mySetting.muted,
            isArchived: mySetting.archived
        });
    }

    return sendResponse(res, 200, response);
};

export const getSpecifyChatInfo = async (req, res) => {
    const { currentProfile } = req.auth;
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return sendResponse(res, 400, {
            success: false,
            code: "INVALID_CHAT_ID",
            message: "Invalid chat id format"
        });
    }

    const chat = await Chat.findById(chatId).populate(
        "users",
        "username displayName primaryPhoto lastSeen"
    );

    if (!chat) {
        return sendResponse(res, 404, {
            success: false,
            code: "CHAT_NOT_FOUND",
            message: "Chat not found"
        });
    }

    const isMember = chat.users.some(
        u => String(u._id) === String(currentProfile._id)
    );

    if (!isMember) {
        return sendResponse(res, 403, {
            success: false,
            code: "CHAT_FORBIDDEN",
            message: "You are not allowed to access this chat"
        });
    }

    if (chat.status !== "active") {
        return sendResponse(res, 409, {
            success: false,
            code: "CHAT_CLOSED",
            message: "This chat is no longer active"
        });
    }

    const opponent = chat.users.find(
        k => String(k._id) !== String(currentProfile._id)
    );

    const mySetting = chat.settings.find(
        k => String(k.userId) === String(currentProfile._id)
    );

    let lastMessage = {
        text: null,
        type: null,
        sender: null,
        messageId: null,
        sentAt: null
    };

    if (chat.lastMessage.sentAt > mySetting.deletedAt) {
        lastMessage = {
            text: chat.lastMessage.text,
            type: chat.lastMessage.type,
            sender: chat.lastMessage.senderId,
            messageId: chat.lastMessage.messageId,
            sentAt: chat.lastMessage.sentAt
        };
    }

    return sendResponse(res, 200, {
        message: "Chat fetched successfully",
        data: {
            chatId: chat._id,
            matchId: chat.matchId,
            opponent: {
                userId: opponent._id,
                username: opponent.username,
                displayName: opponent.displayName,
                primaryPhoto: {
                    url: opponent.primaryPhoto.url
                },
                lastSeen: opponent.lastSeen
            },

            settings: {
                isPinned: mySetting.pinned,
                isMuted: mySetting.muted,
                isArchived: mySetting.archived,
                unreadCount: mySetting.unreadCount
            },
            lastMessage,
            lastMessageAt:
                chat.lastMessage.sentAt > mySetting.deletedAt
                    ? chat.lastMessageAt
                    : null,

            permissions: {
                canSendMessage: true,
                canCall: true,
                canVideoCall: true
            }
        }
    });
};
