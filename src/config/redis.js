import Redis from "ioredis";
import ApiError from "../helpers/ApiError.js";

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
    redis.on("connect", () => {
        console.log("Redis connected successfully");
    });

    redis.on("error", error => {
        const message = "Redis connection unsuccessful!";
        throw new ApiError("InternalServerError", message, 500);
    });
}

export default redis;
