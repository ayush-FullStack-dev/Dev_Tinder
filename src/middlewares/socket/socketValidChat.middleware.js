import mongoose from "mongoose";
import Chat from "../../models/Chat.model.js";
import ApiError from "../../helpers/ApiError.js";

export const socketValidChat = async (socket, chatId) => {
    const { currentProfile } = socket.user;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
        throw new ApiError("INVALID_CHAT_ID", "Invalid chat id format", 400);
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
        throw new ApiError("CHAT_NOT_FOUND", "Chat not found", 404);
    }

    const isMember = chat.users.some(
        u => String(u) === String(currentProfile._id)
    );

    if (!isMember) {
        throw new ApiError(
            "CHAT_FORBIDDEN",
            "You are not allowed to access this chat",
            403
        );
    }

    if (chat.status !== "active") {
        throw new ApiError("CHAT_CLOSED", "This chat is no longer active", 409);
    }

    socket.user.chatInfo = chat;
    return socket;
};
