import Redis from "ioredis";
import ApiError from "../helpers/ApiError.js";
import { success, info, errorLog } from "../../logs/printLogs.js";

const redis = new Redis(process.env.REDIS_URI);

let retryCount = 0;
const MAX_RETRIES = 10;

export function connectRedis() {
    info("CONNECTING REDIS...");

    redis.once("connect", () => {
        success("REDIS CONNECTED ✓");
        retryCount = 0;
    });

    redis.on("error", err => {
        retryCount++;

        errorLog(`Redis error: ${err.message}`);

        if (retryCount >= MAX_RETRIES) {
            errorLog("Max Redis retry limit reached ❌");
            redis.quit();
            return;
        }

        info(`Retrying Redis... (${retryCount}/${MAX_RETRIES})`);
    });
}

export default redis;
