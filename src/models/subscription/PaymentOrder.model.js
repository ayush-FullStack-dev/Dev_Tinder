import mongoose from "mongoose";

const PaymentOrderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
            index: true
        },

        amount: {
            base: {
                type: Number,
                required: true
            },
            discount: {
                type: Number,
                default: 0
            },
            final: {
                type: Number,
                required: true
            },
            currency: {
                type: String,
                default: "INR"
            }
        },

        coupon: {
            couponId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Coupon",
                index: true
            },
            code: {
                type: String,
                uppercase: true
            },
            discountType: {
                type: String,
                enum: ["flat", "percentage"]
            },
            discountValue: Number
        },

        method: {
            type: String,
            enum: ["upi", "card", "netbanking", "wallet"],
            required: true
        },

        gateway: {
            type: String,
            enum: ["razorpay", "stripe", "phonepe"],
            required: true
        },

        gatewayOrderId: String,
        gatewayPaymentId: String,
        gatewaySignature: String,

        status: {
            type: String,
            enum: ["created", "paid", "failed", "refunded"],
            default: "created",
            index: true
        },

        expiresAt: {
            type: Date,
            index: true
        },

        paidAt: Date,
        failedAt: Date,
        failureReason: String,
        refundedAt: Date,

        metadata: {
            ip: String,
            userAgent: String,
            deviceId: String
        }
    },
    {
        timestamps: true
    }
);

PaymentOrderSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("PaymentOrder", PaymentOrderSchema);
