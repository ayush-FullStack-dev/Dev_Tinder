import mongoose from "mongoose";

const AutoPaySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
            index: true
        },

        gatewaySubscriptionId: {
            type: String,
            required: true,
            unique: true
        },

        gateway: {
            type: String,
            enum: ["razorpay", "cashfree"],
            default: "cashfree"
        },

        status: {
            type: String,
            enum: [
                "created",
                "authenticated",
                "active",
                "paused",
                "cancelled",
                "expired"
            ],
            default: "created"
        },

        isTrial: {
            type: Boolean,
            default: false
        },

        nextChargeAt: {
            type: Date
        },

        mandateAmount: {
            type: Number,
            required: true
        },

        currency: {
            type: String,
            default: "INR"
        },

        expiresAt: {
            type: Date,
            expires: 0,
            default: new Date(Date.now() + 1000 * 60 * 15)
        },

        metadata: {
            ip: String,
            deviceId: String,
            userAgent: String
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("AutoPay", AutoPaySchema);
