import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";

import {
    subscribePush
} from "../controllers/push/subscribe.controller.js";
import { unsubscribePush } from "../controllers/push/unsubscribe.controller.js";

const router = express.Router();

router.post("/push/subscribe", isLogin, findLoginData, subscribePush);

router.delete("/push/unsubscribe", isLogin, findLoginData, unsubscribePush);

export default router;
