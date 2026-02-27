import Coupon from "../../../../models/subscription/Coupon.model.js";
import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import Subscription from "../../../../models/subscription/Subscription.model.js";
import cashfree from "../../../../config/cashfree.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { PLANS } from "../../../../constants/subscription/plans.constant.js";
import { METHOD_CONFIG } from "../../../../constants/subscription/checkout.constant.js";

import { buildSubscriptionInfo } from "../../../../helpers/subscription/subscription.helper.js";
import { isValidDate } from "../../../../helpers/time.js";
import { validCoupon } from "../../../../helpers/subscription/coupon.helper.js";

export const validatePlan = (req, res, next) => {
    const { currentProfile } = req.auth;
    const premium = buildSubscriptionInfo(currentProfile.premium);
    const { planId } = req.body;

    if (!["silver", "gold"].includes(planId)) {
        return sendResponse(res, 400, {
            code: "PLAN_NOT_FOUND",
            message: "Selected subscription plan does not exist"
        });
    }

    if (
        PLANS[planId.toUpperCase()].price <
        PLANS[(premium.isActive ? premium.tier : "free").toUpperCase()].price
    ) {
        return sendResponse(res, 409, {
            code: "DOWNGRADE_NOT_ALLOWED",
            message: `Downgrading from ${premium.tier} to ${planId} is not allowed`,
            currentPlan: premium.tier,
            attemptedPlan: planId
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
    const { currentProfile, premium, plan, coupon, method, gateway } = req.auth;

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
        metadata: {
            ip: req.realIp,
            userAgent: req.headers["user-agent"],
            deviceId: req.body.deviceId
        }
    });

    const now = new Date();

    const carriedForwardDays =
        premium?.expiresAt && isValidDate(premium.expiresAt)
            ? Math.max(
                  0,
                  Math.ceil(
                      (new Date(premium.expiresAt) - now) /
                          (1000 * 60 * 60 * 24)
                  )
              )
            : 0;

    await Subscription.create({
        userId: order.userId,
        paymentOrderId: order._id,
        action:
            !premium.isActive || (premium.isActive && premium.tier === plan.id)
                ? "PURCHASE"
                : "UPGRADE",
        fromPlan: premium.isActive ? premium.tier : "free",
        toPlan: plan.id,
        carriedForwardDays
    });

    req.auth.order = order;
    return next();
};

export const createOrder = async (req, res, next) => {
    const { order, user, currentProfile } = req.auth;
    const amount = order.amount;

    const response = await cashfree.PGCreateOrder({
        order_amount: amount.final,
        order_currency: amount.currency,
        order_id: order._id.toString(),
        customer_details: {
            customer_id: currentProfile._id.toString(),
            customer_name: currentProfile.displayName,
            customer_email: user.email,
            customer_phone: currentProfile.phone.mobile
        },
        order_meta: {
            return_url: `https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id=${order._id}`
        }
    });

    const cashfreeOrder = response.data;

    order.gatewayOrderId = cashfreeOrder.cf_order_id;
    await order.save();
    req.auth.cashfreeOrder = cashfreeOrder;
    req.auth.order = order;
    return next();
};

export const sendPayment = (req, res) => {
    const { method, gateway, order, cashfreeOrder } = req.auth;

    return sendResponse(res, 200, {
        orderId: order._id,
        gateway,
        method,
        payment: {
            orderId: cashfreeOrder.order_id,
            paymentSessionId: cashfreeOrder.payment_session_id
        },
        expiresIn: 600
    });
};
