import sendResponse from "../../../../helpers/sendResponse.js";
import Message from "../../../../models/Message.model.js";
import Chat from "../../../../models/Chat.model.js";

import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { getMessageStatus } from "../../../../helpers/chat/message.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const getMessages = async (req, res) => {
    const { currentProfile, chatInfo } = req.auth;

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query = {
        chatId: chatInfo._id
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.createdAt = { $lt: new Date(req.query.cursor) };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1);

    const { pagination, info: messagesInfo } = paginationInfos(
        messages,
        limit,
        "createdAt"
    );

    const response = {
        data: { chatId: chatInfo._id, messages: [] },
        pagination
    };

    await Chat.findOneAndUpdate(
        {
            _id: chatInfo._id,
            status: "active"
        },
        {
            $set: {
                "settings.$[op].unreadCount": 0
            }
        },
        {
            arrayFilters: [
                {
                    "op.userId": currentProfile._id,
                    "op.unreadCount": { $gt: 0 }
                }
            ],
            new: true
        }
    );

    for (const message of messagesInfo) {
        const sender =
            String(message.senderId) === String(currentProfile._id)
                ? "me"
                : "opponent";

        const isDeletedForEveryone = !!message.deletedForEveryoneAt;

        const isDeletedForMe = message.deletedFor.some(
            d => String(d.userId) === String(currentProfile._id)
        );

        if (isDeletedForMe) {
            continue;
        }

        response.data.messages.push({
            messageId: message._id,
            sender,
            type: message.type,
            text: isDeletedForEveryone ? null : message.text,
            media:
                !isDeletedForEveryone &&
                message.type !== "text" &&
                message.media.url
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
                forEveryone: isDeletedForEveryone
            },
            timestamps: {
                sentAt: message.createdAt,
                deliveredAt: message.deliveredTo.deliveredAt,
                readAt: message.readBy.readAt
            },
            status: getMessageStatus(
                isDeletedForEveryone,
                message.readBy,
                message.deliveredTo
            )
        });
    }

    return sendResponse(res, 200, {
        message: response.data.messages.length
            ? "All messages fetched successfull"
            : "no message found",
        ...response
    });
};
