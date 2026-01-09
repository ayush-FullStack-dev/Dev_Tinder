import sendResponse from "../../helpers/sendResponse.js";
import redis from "../../config/redis.js";

import { setSession } from "../../services/session.service.js";

const defaultRateInfo = {
    limit: 5,
    route: "count",
    window: 1,
    block: 10
};

export const rateLimiter = (rateInfo = defaultRateInfo) => {
    const { limit, route } = rateInfo;
    const window = rateInfo.window * 60;
    const block = rateInfo.block * 60;

    return async (req, res, next) => {
        const identifier = req?.auth?.user?.id || req.realIp;
        const rateKey = `rate:${route}:${identifier}`;
        if (await redis.exists(`rate:block:${route}:${identifier}`)) {
            return sendResponse(
                res,
                429,
                "Too many requests. Try again later."
            );
        }

        const count = await redis.incr(rateKey);

        if (count === 1) {
            await redis.expire(rateKey, window);
        }

        if (count > limit) {
            await setSession(
                "blocked",
                identifier,
                `rate:block:${route}`,
                "EX",
                block
            );
            return sendResponse(
                res,
                429,
                `Too many requests. Blocked for ${rateInfo.block} minutes`
            );
        }

        return next();
    };
};

