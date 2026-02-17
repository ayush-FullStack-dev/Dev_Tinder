import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
    {
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
            required: true,
            index: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Profile",
            required: true,
            index: true
        },

        usedCount: {
            type: Number,
            default: 1
        },

        lastUsedAt: {
            type: Date,
            default: () => new Date()
        }
        
    },
    { timestamps: true }
);

couponUsageSchema.index({ couponId: 1, userId: 1 }, { unique: true });

export default mongoose.model("CouponUsage", couponUsageSchema);
