import sendResponse from "../../../../helpers/sendResponse.js";

import Chat from "../../../../models/Chat.model.js";
import Message from "../../../../models/Message.model.js";

export const syncChatInfos = async (req, res) => {
    const { currentProfile } = req.auth;
    const syncedAt = new Date();

    const chats = await Chat.find({
        users: currentProfile._id,
        status: "active"
    }).select("_id");

    const chatsId = chats.map(k => k._id);

    const delivered = await Message.updateMany(
        {
            chatId: { $in: chatsId },
            senderId: { $ne: currentProfile._id },
            "deliveredTo.deliveredAt": null
        },
        {
            deliveredTo: {
                userId: currentProfile._id,
                deliveredAt: syncedAt
            }
        }
    );

    const isAlreadySynced = !delivered.modifiedCount;

    return sendResponse(res, 200, {
        message: isAlreadySynced
            ? "Everything is already synced"
            : "Chat sync completed",
        data: {
            synced: true,
            updated: {
                deliveredMarked: delivered.modifiedCount
            },
            syncedAt
        }
    });
};
