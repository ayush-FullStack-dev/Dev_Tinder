import Coupon from "../../../../models/subscription/Coupon.model.js";
import CouponUsage from "../../../../models/subscription/CouponUsage.model.js";
import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { validCoupon } from "../../../../helpers/subscription/coupon.helper.js";

export const getCoupons = async (req, res) => {
    const { currentProfile } = req.auth;
    const productInfo = req.query;
    const now = new Date();

    if (!productInfo?.price || !productInfo?.name) {
        return sendResponse(res, 400, {
            message: "Missing required fields: price and name",
            data: null
        });
    }

    const coupons = await Coupon.find({
        status: "active",

        validFrom: { $lte: now },
        validTill: { $gte: now },

        minOrderAmount: { $lte: productInfo.price },

        $and: [
            {
                $or: [
                    { applicablePlans: { $size: 0 } },
                    { applicablePlans: productInfo.name }
                ]
            },
            {
                excludedPlans: { $nin: [productInfo.name] }
            }
        ],

        $or: [
            { "usage.totalLimit": { $exists: false } },
            { $expr: { $lt: ["$usage.usedCount", "$usage.totalLimit"] } }
        ]
    });

    const couponIds = coupons.map(coupon => coupon._id);

    const couponsUsage = await CouponUsage.find({
        couponId: {
            $in: couponIds
        },
        userId: currentProfile._id
    });

    const hasPaidBefore = await PaymentOrder.exists({
        userId: currentProfile._id,
        status: "paid"
    });

    const finalCoupons = [];

    for (const coupon of coupons) {
        const usage = couponsUsage.find(
            item => String(item.couponId) === String(coupon._id)
        );

        if (
            usage &&
            coupon.usage.perUserLimit &&
            usage.usedCount >= coupon.usage.perUserLimit
        )
            continue;

        if (coupon.userRestriction === "new_users" && hasPaidBefore) continue;
        if (coupon.userRestriction === "existing_users" && !hasPaidBefore)
            continue;

        finalCoupons.push(coupon);
    }

    return sendResponse(res, 200, {
        message: "Coupons fetched successfully",
        count: finalCoupons.length,
        data: finalCoupons
    });
};

export const validateCoupon = async (req, res) => {
    const { currentProfile } = req.auth;
    const { couponCode, productInfo } = req.body;

    const coupon = await Coupon.findOne({
        code: couponCode,
        status: "active"
    });

    const couponInfo = await validCoupon(coupon, productInfo, currentProfile);

    if (!couponInfo.success) {
        return sendResponse(res, 400, couponInfo);
    }

    return sendResponse(res, 200, {
        message: "Coupon applied successfully",
        info: {
            couponCode: couponCode,
            discountType: couponInfo.discountType,
            discountValue: couponInfo.discountValue,
            discountAmount: couponInfo.discountAmount,
            finalPrice: couponInfo.finalPrice
        }
    });
};
