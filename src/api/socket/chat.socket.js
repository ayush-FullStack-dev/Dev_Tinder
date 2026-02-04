import { sendRealTimeMessage } from "../controllers/socket/chat/sendMessage.controller.js";
import {
    readMessage,
    syncChatInfos
} from "../controllers/socket/chat/readMessage.controller.js";
import { deleteRealTimeMessage } from "../controllers/socket/chat/deleteMessage.controller.js";
import {
    globalTyping,
    globalStopTyping,
    typing,
    stopTyping
} from "../controllers/socket/chat/presence.socket.js";
import {
    globalOnline,
    globalOffline,
    syncPresence
} from "../controllers/socket/chat/onlinePresence.socket.js";
import {
    reactToMessage,
    unreactToMessage
} from "../controllers/socket/chat/message/reactMessage.socket.js";
import { editRealTimeMessage } from "../controllers/socket/chat/message/editMessage.socket.js";

import { socketValidChat } from "../../middlewares/socket/socketValidChat.middleware.js";

export const registerChatSocket = chatIO => {
    chatIO.on("connection", socket => {
        
        socket.join(`user:${socket.user.currentProfile._id}`);

        globalOnline(socket);
        socket.on("disconnect", globalOffline(socket));
        socket.on("chat:syncPresence", syncPresence(socket));
        socket.on("chat:list:typing", globalTyping(socket));
        socket.on("chat:list:stopTyping", globalStopTyping(socket));

        socket.on("chat:join", async ({ chatId }, ack) => {
            try {
                socket.data.chatId = chatId;
                socket = await socketValidChat(socket, chatId);

                socket.join(`chat:${chatId}`);
                syncChatInfos(socket);

                // main events
                socket.on("chat:send", sendRealTimeMessage(socket));
                socket.on("chat:read", readMessage(socket));
                socket.on("chat:deleteMessage", deleteRealTimeMessage(socket));

                // TYPING EVENTS
                socket.on("chat:typing", typing(socket));
                socket.on("chat:stopTyping", stopTyping(socket));

                // react events
                socket.on("chat:message:react", reactToMessage(socket));
                socket.on("chat:message:unreact", unreactToMessage(socket));

                // edit events
                socket.on("chat:message:edit", editRealTimeMessage(socket));

                return ack?.({
                    success: true,
                    message: "Joined chat"
                });
            } catch (err) {
                return ack?.({
                    success: false,
                    code: err.code || "JOIN_FAILED",
                    message: err.message || "Failed to join chat"
                });
            }
        });
    });
};
