import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String
        },

        discount: {
            type: {
                type: String,
                enum: ["flat", "percentage"],
                required: true
            },
            value: {
                type: Number,
                required: true
            },
            maxDiscount: {
                type: Number,
                default: null
            }
        },

        // 🧾 Order Rules
        minOrderAmount: {
            type: Number,
            default: 0
        },

        applicablePlans: {
            type: [String],
            default: []
        },

        excludedPlans: {
            type: [String],
            default: []
        },

        validFrom: {
            type: Date,
            required: true
        },
        validTill: {
            type: Date,
            required: true
        },

        usage: {
            totalLimit: {
                type: Number,
                default: null
            },
            perUserLimit: {
                type: Number,
                default: 1
            },
            usedCount: {
                type: Number,
                default: 0
            }
        },

        userRestriction: {
            type: String,
            enum: ["all", "new_users", "existing_users"],
            default: "all"
        },

        stackable: {
            type: Boolean,
            default: false
        },

        status: {
            type: String,
            enum: ["active", "disabled", "expired"],
            default: "active",
            index: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
            default: null
        },

        expiredAt: {
            type: Date,
            expires: 0,
            default: null
        }
    },
    {
        timestamps: true
    }
);

CouponSchema.index({ code: 1, status: 1 });
CouponSchema.index({ validFrom: 1, validTill: 1 });

export default mongoose.model("Coupon", CouponSchema);
