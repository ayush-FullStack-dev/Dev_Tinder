import mongoose from "mongoose";

import { reportReason } from "../constants/profile.constant.js";

const reportSchema = new mongoose.Schema({
    reporterUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    reportedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    reason: {
        type: String,
        enum: reportReason,
        required: true
    },
    message: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "action_taken", "dismissed"],
        default: "pending"
    },
    resolvedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    deletedAt: {
        type: Date,
        default: null,
        expires: 0
    }
});

export default mongoose.model("Report", reportSchema);
