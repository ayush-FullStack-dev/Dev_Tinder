import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import { validateChatAccess } from "../../middlewares/user/chat/chat.controller.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import { getChats } from "../controllers/user/chat/inbox.controller.js";
import {
    getMessages,
    clearAllMessages,
    deleteAllMessages
} from "../controllers/user/chat/message/messages.controller.js";
import {
    togglePinChat,
    toggleMuteChat,
    toggleArchiveChat
} from "../controllers/user/chat/chatSettings.controller.js";
import { uploadChatMedia } from "../controllers/user/chat/chatUpload.controller.js";
import { syncChatInfos } from "../controllers/user/chat/sync.controller.js";

const router = express.Router();

router.use(
    isLogin,
    findLoginData,
    isProfileExists,
    rateLimiter({
        limit: 50,
        window: 2,
        block: 5,
        route: "chat:base"
    })
);

router.get("/", getChats);
router.post("/sync", syncChatInfos);
router.post("/upload", uploadChatMedia);

router.use("/:chatId", validateChatAccess);
router.delete("/:chatId", deleteAllMessages);
router.delete("/:chatId/clear", clearAllMessages);
router.get("/:chatId/messages", getMessages);

// settings
router.patch("/:chatId/pin", togglePinChat);
router.patch("/:chatId/mute", toggleMuteChat);
router.patch("/:chatId/archive", toggleArchiveChat);

export default router;
