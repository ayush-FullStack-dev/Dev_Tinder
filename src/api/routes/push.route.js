import express from "express";
import {
    isLogin,
    findLoginData
} from "../../middlewares/auth/auth.middleware.js";
import { rateLimiter } from "../../middlewares/auth/security.middleware.js";

import { subscribePush } from "../controllers/push/subscribe.controller.js";
import { unsubscribePush } from "../controllers/push/unsubscribe.controller.js";

const router = express.Router();

router.post(
  "/subscribe",
  isLogin,
  findLoginData,
  rateLimiter({
    limit: 20,
    window: 1,
    block: 2,
    route: "push:subscribe"
  }),
  subscribePush
);

router.delete(
  "/unsubscribe",
  isLogin,
  findLoginData,
  rateLimiter({
    limit: 20,
    window: 1,
    block: 2,
    route: "push:unsubscribe"
  }),
  unsubscribePush
);

export default router;
