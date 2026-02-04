import sendResponse from "../../../../helpers/sendResponse.js";
import Chat from "../../../../models/Chat.model.js";

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
