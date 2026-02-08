import {
    startVoiceCall,
    startVideoCall
} from "../controllers/socket/call/startCall.controller.js";
import {
    rejectCall,
    endCall,
    cancelCall
} from "../controllers/socket/call/rejectCall.controller.js";
import { acceptCall } from "../controllers/socket/call/acceptCall.controller.js";
import { callSignal } from "../controllers/socket/call/webrtc.controller.js";
import {
    muteCall,
    videoCall
} from "../controllers/socket/call/presence.controller.js";
import {
    handleDisconnect,
    handleReconnect
} from "../controllers/socket/call/connect.controller.js";
import { syncActiveCalls } from "../controllers/socket/call/callSync.controller.js";

import { socketValidChat } from "../../middlewares/socket/socketValidChat.middleware.js";

export const registerCallSocket = callIO => {
    callIO.on("connection", socket => {
        socket.join(`user:${socket.user.currentProfile._id}`);

        socket.on("disconnect", handleDisconnect(socket));

        process.nextTick(() => {
            syncActiveCalls(socket);
        });

socket.on("call:sync", () => {
                    syncActiveCalls(socket);
                });
                
        socket.on("call:join", async ({ chatId }, ack) => {
            try {
                socket = await socketValidChat(socket, chatId);

                socket.on("call:voice:start", startVoiceCall(socket));
                socket.on("call:video:start", startVideoCall(socket));
                socket.on("call:cancel", cancelCall(socket));
                socket.on("call:end", endCall(socket));
                socket.on("call:accept", acceptCall(socket));
                socket.on("call:reject", rejectCall(socket));
                socket.on("call:signal", callSignal(socket));
                socket.on("call:mute", muteCall(socket));
                socket.on("call:video", videoCall(socket));
                socket.on("call:reconnect", handleReconnect(socket));

                return ack?.({
                    success: true,
                    message: "Joined room"
                });
            } catch (err) {
                return ack?.({
                    success: false,
                    code: err.code || "JOIN_FAILED",
                    message: err.message || "Failed to join room"
                });
            }
        });
    });
};
