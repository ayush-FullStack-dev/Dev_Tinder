import Coupon from "../../../../models/subscription/Coupon.model.js";
import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import razorpay from "../../../../config/razorpay.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { PLANS } from "../../../../constants/subscription/plans.constant.js";
import { METHOD_CONFIG } from "../../../../constants/subscription/checkout.constant.js";

import { buildSubscriptionInfo } from "../../../../helpers/subscription/subscription.helper.js";
import { validCoupon } from "../../../../helpers/subscription/coupon.helper.js";

export const validatePlan = (req, res, next) => {
    const { currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);
    const isGold = premium.isActive && premium.tier === "gold";

    const { planId } = req.body;

    if (!["silver", "gold"].includes(planId)) {
        return sendResponse(res, 400, {
            code: "PLAN_NOT_FOUND",
            message: "Selected subscription plan does not exist"
        });
    }

    if (premium.isActive && premium.tier === planId) {
        return sendResponse(res, 409, {
            code: "PLAN_ALREADY_ACTIVE",
            message: `You already have an active ${premium.tier} subscription`,
            currentPlan: premium.tier
        });
    }

    if (isGold && planId === "silver") {
        return sendResponse(res, 409, {
            code: "DOWNGRADE_NOT_ALLOWED",
            message:
                "You already have an active Gold plan. Downgrading to Silver is not allowed.",
            currentPlan: "gold",
            attemptedPlan: "silver"
        });
    }

    req.auth = {
        ...req.auth,
        premium,
        plan: {
            ...PLANS[planId.toUpperCase()],
            features: null
        },
        planId,
        couponCode: req.body.coupon,
        method: req.body.method
    };

    return next();
};

export const validateMethod = async (req, res, next) => {
    const { currentProfile, method } = req.auth;

    if (!METHOD_CONFIG[method]) {
        return sendResponse(res, 400, {
            code: "PAYMENT_METHOD_NOT_SUPPORTED",
            message: "Selected payment method is not available",
            availableMethods: Object.keys(METHOD_CONFIG)
        });
    }

    req.auth.gateway = METHOD_CONFIG[method].gateway;
    return next();
};

export const validateCoupon = async (req, res, next) => {
    const { currentProfile, plan, couponCode } = req.auth;

    if (!couponCode) return next();

    const coupon = await Coupon.findOne({
        code: couponCode,
        status: "active"
    });

    const error = await validCoupon(coupon, plan, currentProfile);

    if (error?.success === false) {
        return sendResponse(res, error.statusCode, error.res);
    }

    req.auth.coupon = coupon;
    return next();
};

export const finalizeAmount = async (req, res, next) => {
    const { currentProfile, plan, coupon, method, gateway } = req.auth;
    const baseAmount = plan.price;
    let finalAmount = baseAmount;
    let discount = 0;

    if (coupon) {
        if (coupon.discount.type === "flat") {
            discount = coupon.discount.value;
        }
        if (coupon.discount.type === "percentage") {
            discount = (baseAmount * coupon.discount.value) / 100;
            if (coupon.discount.maxDiscount) {
                discount = Math.min(discount, coupon.discount.maxDiscount);
            }
        }
    }

    discount = Math.min(discount, baseAmount);
    finalAmount = baseAmount - discount;

    const order = await PaymentOrder.create({
        userId: currentProfile._id,
        amount: {
            base: baseAmount,
            discount,
            final: finalAmount
        },
        coupon: coupon
            ? {
                  couponId: coupon._id,
                  code: coupon.code,
                  discountType: coupon.discount.type,
                  discountValue: discount
              }
            : null,
        method,
        gateway,
        expiresAt: new Date(Date.now() + 1000 * 60 * 10),
        metadata: {
            ip: req.realIp,
            userAgent: req.headers["user-agent"],
            deviceId: req.body.deviceId
        }
    });

    req.auth.order = order;
    return next();
};

export const createOrder = async (req, res, next) => {
    const { order } = req.auth;
    const amount = order.amount;

    const razorpayOrder = await razorpay.orders.create({
        amount: amount.final * 100,
        currency: amount.currency,
        receipt: order._id.toString(),
        payment_capture: 1
    });

    const updatedOrder = await PaymentOrder.findByIdAndUpdate(
        order._id,
        {
            gatewayOrderId: razorpayOrder.id
        },
        { new: true }
    );

    req.auth.razorpayOrder = razorpayOrder;
    req.auth.amount = amount;
    req.auth.order = updatedOrder;
    return next();
};

export const sendPayment = (req, res) => {
    const { method, gateway, order, razorpayOrder } = req.auth;

    return sendResponse(res, 200, {
        success: true,
        orderId: order._id,
        gateway,
        method,
        payment: {
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        },
        expiresIn: 600
    });
};
