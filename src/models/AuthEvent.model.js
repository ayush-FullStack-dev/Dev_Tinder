import mongoose from "mongoose";

import {
    platform,
    loginMethods,
    eventType,
    riskLevel,
    twoFaMethods
} from "../constants/auth.constant.js";

const authEventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    eventType: {
        type: String,
        default: "login",
        enum: [...eventType]
    },
    action: {
        type: String
    },
    deviceId: {
        type: String
    },
    ip: {
        type: String
    },
    ipCountry: {
        type: String
    },
    ipCity: {
        type: String
    },
    userAgent: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        default: "web",
        enum: [...platform]
    },
    loginMethod: {
        type: String,
        enum: [...loginMethods]
    },
    mfaUsed: {
        type: String,
        enum: [...twoFaMethods, "none"],
        default: "none"
    },
    success: {
        type: Boolean,
        default: false
    },
    risk: {
        type: String,
        enum: [...riskLevel],
        required: true
    },
    trusted: {
        type: Boolean,
        default: false
    },
    reason: {
        type: String,
        default: "none"
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        expires: 0
    }
});

export default new mongoose.model("AuthEvent", authEventSchema);
