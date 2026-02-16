import Coupon from "../../../../models/subscription/Coupon.model.js";
import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import razorpay from "../../../../config/razorpay.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { PLANS } from "../../../../constants/subscription/plans.constant.js";
import { METHOD_CONFIG } from "../../../../constants/subscription/checkout.constant.js";
import { verifyPaymentValidator } from "../../../../validators/user/subscription/webhook.validator.js";

import { checkValidation } from "../../../../helpers/helpers.js";

export const validateBody = (req, res, next) => {
    console.log(req.body);

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
    const crypto = require("crypto");

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RZP_WEBHOOK_SECRET)
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

    if (!payment || !payment.order_id) {
        return sendResponse(res, 400, {});
    }

    const isSuccess = event === "payment.captured";
    const isFailed =
        event === "payment.failed" || event === "payment.authorized";

    const order = await PaymentOrder.findOne({
        gatewayOrderId: payment.order_id,
        gateway: "razorpay"
    });

    if (!order) {
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
        return next();
    }

    if (isFailed) {
        order.status = "failed";
        order.failedAt = new Date();
        await order.save();

        return sendResponse(res, 200, {});
    }

    return sendResponse(res, 200, {});
};
