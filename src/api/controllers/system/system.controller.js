import mongoose from "mongoose";
import redis from "../../../config/redis.js";
import sendResponse from "../../../helpers/sendResponse.js";

import { transporter } from "../../../helpers/mail.js";

export const systemHealth = async (req, res) => {
    let statusCode = 200;
    const services = {
        db: "ok",
        redis: "ok",
        mail: "ok",
        push: "ok"
    };

    if (mongoose.connection.readyState !== 1) {
        statusCode = 503;
        services.db = "down";
    }

    if (redis.status !== "ready") {
        statusCode = 503;
        services.redis = "down";
    }
    if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_PUBLIC_KEY) {
        statusCode = 503;
        services.push = "disabled";
    }

    transporter.verify().catch(err => {
        statusCode = 503;
        services.mail = "disabled";
    });

    return sendResponse(res, statusCode, {
        success: true,
        status: statusCode === 503 ? "degraded" : "ok",
        services,
        timestamp: new Date()
    });
};
