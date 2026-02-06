import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
    {
        chatId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
            index: true
        },

        callerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true
        },

        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true
        },

        type: {
            type: String,
            enum: ["voice", "video"],
            required: true
        },

        status: {
            type: String,
            enum: [
                "calling",
                "ringing",
                "ongoing",
                "ended",
                "missed",
                "rejected"
            ],
            default: "calling",
            index: true
        },
        iceBuffer: {
            type: [
                {
                    candidate: String,
                    sdpMid: String,
                    sdpMLineIndex: Number
                }
            ],
            default: []
        },
        _flushedIce: {
            type: [Object],
            default: undefined
        },

        startedAt: {
            type: Date,
            default: null
        },

        endedAt: {
            type: Date,
            default: null
        },

        duration: {
            type: Number,
            default: 0
        },

        endReason: {
            type: String,
            enum: ["hangup", "missed", "rejected", "network"],
            default: null
        }
    },
    { timestamps: true }
);

export default mongoose.model("Call", callSchema);
