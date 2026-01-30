import { Server } from "socket.io";

import { socketAuth } from "./src/middlewares/socket/socketAuth.middleware.js";
import { findSocketAuthInfo } from "./src/middlewares/socket/findSocketAuthInfo.middleware.js";
import { socketProfile } from "./src/middlewares/socket/socketProfile.middleware.js";

let io;

export const initSocket = server => {
    io = new Server(server, {
        cors: { origin: "*", methods: ["GET", "POST"] }
    });

    const chatIO = io.of("/chat");

    chatIO.use(socketAuth);
    chatIO.use(findSocketAuthInfo);
    chatIO.use(socketProfile);

    return { io, chatIO };
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};
