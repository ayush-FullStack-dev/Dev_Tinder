import Redis from "ioredis";
import ApiError from "../helpers/ApiError.js";
import { success, info } from "../../logs/printLogs.js";

const redis = new Redis({
    port: process.env.REDIS_PORT || 6379,
    host: process.env.REDIS_HOST || "localhost",
    db: process.env.REDIS_DB || 0,
    ...(process.env.REDIS_PASSWORD && {
        username: process.env.REDIS_USERNAME || "default",
        password: process.env.REDIS_PASSWORD || "default"
    })
});

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
