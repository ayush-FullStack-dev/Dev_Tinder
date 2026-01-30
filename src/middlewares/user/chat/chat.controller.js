import mongoose from "mongoose";
import Chat from "../../../models/Chat.model.js";
import sendResponse from "../../../helpers/sendResponse.js";

export const validateChatAccess = async (req, res, next) => {
    const { currentProfile } = req.auth;
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return sendResponse(res, 400, {
            success: false,
            code: "INVALID_CHAT_ID",
            message: "Invalid chat id format"
        });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        return sendResponse(res, 404, {
            success: false,
            code: "CHAT_NOT_FOUND",
            message: "Chat not found"
        });
    }

    const isMember = chat.users.some(
        u => String(u) === String(currentProfile._id)
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

    req.auth.chatInfo = chat;
    return next();
};
