import mongoose from "mongoose";

const deviceInfoSchema = new mongoose.Schema(
    {
        platform: {
            type: String,
            enum: ["web", "android", "ios"],
            default: "web"
        },

        browser: {
            type: String
        },
        os: {
            type: String
        },
        userAgent: {
            type: String
        },

        ipCountry: {
            type: String
        },
        ipCity: {
            type: String
        }
    },
    { _id: false }
);

const pushSubscriptionSchema = mongoose.Schema({
    deviceIdHash: {
        type: String,
        index: true,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    deviceInfo: {
        type: deviceInfoSchema,
        required: true
    },
    createdAt: {
        type: Date,
        default: () => new Date()
    },
    lastUsedAt: {
        type: Date,
        default: () => new Date()
    },
    deletedAt: {
        type: Date,
        default: null,
        expires: 0
    }
});

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
