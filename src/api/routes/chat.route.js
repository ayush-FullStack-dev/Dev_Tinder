import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { isProfileExists } from "../../middlewares/user/profile.middleware.js";
import { validateChatAccess } from "../../middlewares/user/chat/chat.controller.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import { getChats } from "../controllers/user/chat/inbox.controller.js";
import { getMessages } from "../controllers/user/chat/messages.controller.js";
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
router.get("/:chatId/messages", validateChatAccess, getMessages);


export default router;
