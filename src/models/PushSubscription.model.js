import mongoose from "mongoose";

const pushSubscriptionSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
        required: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
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
    deviceInfo: Object,
    createdAt: {
        type: Date,
        default: Date.now()
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
