import Chat from "../../../../models/Chat.model.js";
import { updateProfile } from "../../../../services/profile.service.js";

export const globalTyping = socket => async () => {
    const { currentProfile } = socket.user;

    const chats = await Chat.find({ users: currentProfile._id });

    for (const chat of chats) {
        const opponentIds = chat.users.find(
            u => String(u) !== String(currentProfile._id)
        );

        socket.to(`user:${opponentIds}`).emit("chat:list:typing", {
            chatId: chat._id,
            typing: true
        });
    }
};

export const globalStopTyping = socket => async () => {
    const { currentProfile } = socket.user;

    const chats = await Chat.find({ users: currentProfile._id });

    for (const chat of chats) {
        const opponentIds = chat.users.find(
            u => String(u) !== String(currentProfile._id)
        );

        socket.to(`user:${opponentIds}`).emit("chat:list:stopTyping", {
            chatId: chat._id,
            typing: false
        });
    }
};

export const typing = socket => () => {
    const chatId = socket.data.chatId;

    socket.to(`chat:${chatId}`).emit("chat:typing", {
        chatId,
        typing: true
    });
};

export const stopTyping = socket => () => {
    const chatId = socket.data.chatId;

    socket.to(`chat:${chatId}`).emit("chat:typing", {
        chatId,
        typing: false
    });
};

