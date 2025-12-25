import Redis from "ioredis";
import ApiError from "../helpers/ApiError.js";
import { success, info } from "../../logs/printLogs.js";

const redis = new Redis(process.env.REDIS_URI);

export function connectRedis() {
    info("CONNECTING REDIS ...");
    redis.on("connect", () => {
        success("REDIS CONNECTED ✓");
    });

    redis.on("error", error => {
        throw new ApiError("InternalServerError", "Redis connection unsuccessfully", 500);
    });
}

export default redis;
