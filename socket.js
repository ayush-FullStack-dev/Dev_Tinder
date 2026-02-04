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
    const callIO = io.of("/call");

    chatIO.use(socketAuth);
    chatIO.use(findSocketAuthInfo);
    chatIO.use(socketProfile);

    callIO.use(socketAuth);
    callIO.use(findSocketAuthInfo);
    callIO.use(socketProfile);

    return { io, chatIO, callIO };
};

export const getIO = () => {
    if (!io) throw new Error("Socket.io not initialized");
    return io;
};
