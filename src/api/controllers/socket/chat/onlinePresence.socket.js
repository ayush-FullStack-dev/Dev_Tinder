import Chat from "../../../../models/Chat.model.js";
import Profile from "../../../../models/Profile.model.js";
import { updateProfile } from "../../../../services/profile.service.js";

export const syncPresence =
    socket =>
    async (...args) => {
        const ack =
            typeof args[args.length - 1] === "function"
                ? args[args.length - 1]
                : null;

        const profileId = socket.user.currentProfile._id;
        const chats = await Chat.find({ users: profileId }).select("users");

        const onlineUsers = [];
        const offlineUserIds = [];
        const resultMap = {};

        chats.forEach(chat => {
            const opponentId = chat.users.find(
                id => String(id) !== String(profileId)
            );
            if (!opponentId) return;

            const isOnline = socket.adapter.rooms.has(`user:${opponentId}`);

            if (isOnline) {
                resultMap[chat._id] = {
                    online: true,
                    userId: opponentId,
                    lastSeen: null
                };
            } else {
                offlineUserIds.push(opponentId);
                resultMap[chat._id] = {
                    online: false,
                    userId: opponentId,
                    lastSeen: null
                };
            }
        });

        if (offlineUserIds.length > 0) {
            const offlineUsersData = await Profile.find({
                _id: { $in: offlineUserIds }
            }).select("_id lastSeen");

            offlineUsersData.forEach(user => {
                for (const [chatId, data] of Object.entries(resultMap)) {
                    if (String(data.userId) === String(user._id)) {
                        resultMap[chatId].lastSeen = user.lastSeen;
                    }
                }
            });
        }

        return ack?.({ success: true, data: resultMap });
    };

export const globalOnline = async socket => {
    const { currentProfile } = socket.user;

    const chats = await Chat.find({ users: currentProfile._id }).select(
        "users"
    );

    for (const chat of chats) {
        const opponentId = chat.users.find(
            u => String(u) !== String(currentProfile._id)
        );

        socket.to(`user:${opponentId}`).emit("chat:online", {
            chat: chat._id,
            online: true
        });
    }
};

export const globalOffline = socket => async () => {
    const { currentProfile } = socket.user;

    await updateProfile(
        {
            _id: currentProfile._id
        },
        {
            $set: {
                lastSeen: new Date()
            }
        }
    );

    const chats = await Chat.find({ users: currentProfile._id }).select(
        "users"
    );

    for (const chat of chats) {
        const opponentId = chat.users.find(
            u => String(u) !== String(currentProfile._id)
        );

        socket.to(`user:${opponentId}`).emit("chat:offline", {
            chat: chat._id,
            online: false,
            lastSeen: new Date()
        });

        const isOffline = !socket.adapter.rooms.has(`user:${opponentId}`);

        if (isOffline) {
            socket.emit("chat:offline", {
                chat: chat._id,
                online: false,
                lastSeen: new Date()
            });
        }
    }
};
