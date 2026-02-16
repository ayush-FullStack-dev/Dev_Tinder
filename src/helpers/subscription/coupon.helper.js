import CouponUsage from "../../models/subscription/CouponUsage.model.js";
import PaymentOrder from "../../models/subscription/PaymentOrder.model.js";

export const validCoupon = async (couponInfo, plan, currentUser) => {
    if (!couponInfo) {
        return {
            success: false,
            statusCode: 400,
            res: {
                code: "COUPON_INVALID",
                message: "Coupon code is invalid or expired"
            }
        };
    }

    const usage = await CouponUsage.findOne({
        couponId: couponInfo._id,
        userId: currentUser._id
    });

    if (couponInfo.validFrom > new Date()) {
        return {
            success: false,
            statusCode: 409,
            res: {
                code: "COUPON_NOT_ACTIVE",
                message: "This coupon is not active yet",
                action: "WAIT"
            }
        };
    }

    if (couponInfo.validTill < new Date()) {
        return {
            success: false,
            statusCode: 410,
            res: {
                code: "COUPON_EXPIRED",
                message: "This coupon has expired",
                action: "REMOVE_COUPON"
            }
        };
    }

    if (plan.price < couponInfo.minOrderAmount) {
        return {
            success: false,
            statusCode: 400,
            res: {
                code: "MIN_ORDER_NOT_MET",
                message: `Minimum order amount ₹${couponInfo.minOrderAmount} required`,
                action: "UPGRADE_PLAN"
            }
        };
    }

    if (
        usage &&
        couponInfo.usage.perUserLimit &&
        usage.usedCount >= couponInfo.usage.perUserLimit
    ) {
        return {
            success: false,
            statusCode: 403,
            res: {
                code: "COUPON_USER_LIMIT_REACHED",
                message: "You have already used this coupon",
                action: "REMOVE_COUPON"
            }
        };
    }

    if (
        couponInfo.usage.totalLimit &&
        couponInfo.usage.usedCount >= couponInfo.usage.totalLimit
    ) {
        return {
            success: false,
            statusCode: 409,
            res: {
                code: "COUPON_USAGE_LIMIT_REACHED",
                message: "This coupon has reached its usage limit",
                action: "REMOVE_COUPON"
            }
        };
    }

    if (
        couponInfo.applicablePlans.length &&
        !couponInfo.applicablePlans.includes(plan.id)
    ) {
        return {
            success: false,
            statusCode: 400, // Bad Request
            res: {
                code: "COUPON_NOT_APPLICABLE",
                message: "This coupon is not applicable for selected plan",
                action: "CHANGE_PLAN"
            }
        };
    }

    if (couponInfo.excludedPlans.includes(plan.id)) {
        return {
            success: false,
            statusCode: 403,
            res: {
                code: "PLAN_EXCLUDED",
                message: "This coupon cannot be used with selected plan",
                action: "CHANGE_PLAN"
            }
        };
    }

    const hasPaidBefore = await PaymentOrder.exists({
        userId: currentUser._id,
        status: "paid"
    });

    if (couponInfo.userRestriction === "new_users" && hasPaidBefore) {
        return {
            success: false,
            statusCode: 403,
            res: {
                code: "COUPON_NEW_USERS_ONLY",
                message: "This coupon is only for new users",
                action: "REMOVE_COUPON"
            }
        };
    }

    if (couponInfo.userRestriction === "existing_users" && !hasPaidBefore) {
        return {
            success: false,
            statusCode: 403,
            res: {
                code: "COUPON_EXISTING_USERS_ONLY",
                message: "This coupon is only for existing users",
                action: "REMOVE_COUPON"
            }
        };
    }

    return true;
};
