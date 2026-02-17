import Coupon from "../../../../models/subscription/Coupon.model.js";
import CouponUsage from "../../../../models/subscription/CouponUsage.model.js";
import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import Subscription from "../../../../models/subscription/Subscription.model.js";
import crypto from "crypto";
import razorpay from "../../../../config/razorpay.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { PLANS } from "../../../../constants/subscription/plans.constant.js";
import { METHOD_CONFIG } from "../../../../constants/subscription/checkout.constant.js";
import { verifyPaymentValidator } from "../../../../validators/user/subscription/payment.validator.js";

import { checkValidation } from "../../../../helpers/helpers.js";
import { updateProfile } from "../../../../services/profile.service.js";

export const validateBody = (req, res, next) => {
    const validPayment = checkValidation(
        verifyPaymentValidator,
        req,
        "Invalid payment payload"
    );

    if (!validPayment?.success) {
        return sendResponse(res, 400, validPayment.jsonResponse);
    }

    req.auth = { ...req.auth, value: validPayment.value };

    return next();
};

export const validateSigntaure = (req, res, next) => {
    const { value } = req.auth;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(JSON.stringify(value))
        .digest("hex");

    if (expectedSignature !== req.headers["x-razorpay-signature"]) {
        return sendResponse(res, 400, {
            code: "INVALID_SIGNATURE"
        });
    }

    return next();
};

export const validateOrder = async (req, res, next) => {
    const { value } = req.auth;
    const event = value.event;
    const payment = value.payload.payment.entity;

    if (!payment || !payment?.order_id) {
        return sendResponse(res, 400, {});
    }

    const isSuccess = event === "payment.captured";

    const isFailed =
        event === "payment.failed" || event === "payment.authorized";

    const order = await PaymentOrder.findOne({
        gatewayOrderId: payment.order_id,
        gateway: "razorpay"
    });

    const subscription = await Subscription.findOne({
        paymentOrderId: order._id
    });

    if (!order || !subscription) {
        return sendResponse(res, 200, {});
    }

    if (["paid", "failed", "refunded"].includes(order.status)) {
        return sendResponse(res, 200, {});
    }

    if (payment.amount !== order.amount.final * 100) {
        await PaymentOrder.findByIdAndUpdate(order._id, {
            status: "failed",
            failedAt: new Date(),
            failureReason: "AMOUNT_MISMATCH"
        });

        return sendResponse(res, 400, {});
    }

    if (isSuccess) {
        order.status = "paid";
        order.gatewayPaymentId = payment.id;
        order.paidAt = new Date();
        order.expiresAt = null;

        await order.save();

        req.auth.order = order;
        req.auth.payment = payment;
        req.auth.subscription = subscription;
        return next();
    }

    if (isFailed) {
        await Subscription.findByIdAndUpdate(subscription._id, {
            action: "PAYMENT_FAILED"
        });

        order.status = "failed";
        order.failedAt = new Date();
        await order.save();
    }

    return sendResponse(res, 200, {});
};

export const handlePaymentCoupon = async (req, res, next) => {
    const { order } = req.auth;
    const coupon = order.coupon;

    if (!coupon?.code) {
        return next();
    }

    const couponInfo = await Coupon.findOneAndUpdate(
        {
            code: coupon.code
        },
        {
            $inc: { "usage.usedCount": 1 }
        },
        { new: true }
    );

    await CouponUsage.findOneAndUpdate(
        {
            couponId: couponInfo._id,
            userId: order.userId
        },
        {
            $inc: { usedCount: 1 },
            $set: { lastUsedAt: new Date() },
            $setOnInsert: {
                couponId: couponInfo._id,
                userId: order.userId,
                createdAt: new Date()
            }
        },
        {
            upsert: true,
            new: true
        }
    );

    return next();
};

export const handlePaymentSuccess = async (req, res) => {
    const { order, subscription } = req.auth;
    const plan = PLANS[subscription.toPlan.toUpperCase()];
    const day = 1000 * 60 * 60 * 24;

    const expireIn =
        subscription.fromPlan === subscription.toPlan
            ? day * (subscription.carriedForwardDays + 30)
            : day * 30;

    const profile = await updateProfile(
        subscription.userId,
        {
            $inc: {
                "packs.benefits.boosts": plan.features.monthlyBoostCredits
            },
            $set: {
                premium: {
                    type: subscription.toPlan,
                    isLifetime: subscription.isLifetime,
                    since: new Date(),
                    expiresAt: new Date(Date.now() + expireIn)
                }
            }
        },
        { id: true }
    );

    if (!profile) return sendResponse(res, 404, {});

    return sendResponse(res, 200, { success: true });
};
