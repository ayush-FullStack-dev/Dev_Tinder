import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import Subscription from "../../../../models/subscription/Subscription.model.js";
import AutoPay from "../../../../models/subscription/AutoPay.model.js";
import sendResponse from "../../../../helpers/sendResponse.js";

import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const subscriptionHistory = async (req, res, next) => {
    const { currentProfile } = req.auth;

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const type = req.query.type || "all"; // payment | autopay | all

    const baseQuery = {
        userId: currentProfile._id
    };

    // cursor handling
    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        baseQuery.createdAt = { $lt: new Date(req.query.cursor) };
    }

    let paymentHistory = [];
    let autoPayHistory = [];

    if (type === "payment" || type === "all") {
        const orderInfos = await PaymentOrder.find(baseQuery)
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1);

        const { pagination, info: orders } = paginationInfos(
            orderInfos,
            limit,
            "createdAt"
        );

        const orderIds = orders.map(o => o._id);

        const subscriptions = await Subscription.find({
            paymentOrderId: { $in: orderIds }
        });

        paymentHistory = orders
            .map(order => {
                const sub = subscriptions.find(
                    s => String(s.paymentOrderId) === String(order._id)
                );

                if (!sub) return null;

                return {
                    type: "PAYMENT",

                    orderId: order._id,

                    plan: {
                        from: sub.fromPlan,
                        to: sub.toPlan,
                        action: sub.action
                    },

                    amount: {
                        base: order.amount.base,
                        discount: order.amount.discount,
                        final: order.amount.final,
                        currency: order.amount.currency
                    },

                    coupon: order.coupon?.couponId
                        ? {
                              code: order.coupon.code,
                              type: order.coupon.discountType,
                              value: order.coupon.discountValue
                          }
                        : null,

                    payment: {
                        method: order.method,
                        gateway: order.gateway,
                        status: order.status,
                        paidAt: order.paidAt,
                        failedAt: order.failedAt,
                        failureReason: order.failureReason,
                        refundedAt: order.refundedAt
                    },

                    metadata: {
                        ip: order.metadata?.ip,
                        isCurrent:
                            order.metadata?.deviceId === req.body.deviceId
                    },

                    subscription: {
                        carriedForwardDays: sub.carriedForwardDays,
                        isLifetime: sub.isLifetime
                    },

                    createdAt: order.createdAt
                };
            })
            .filter(Boolean);
    }

    if (type === "autopay" || type === "all") {
        const autoSubs = await Subscription.find({
            userId: currentProfile._id,
            autoPayOrderId: { $ne: null },
            ...(baseQuery.createdAt && { createdAt: baseQuery.createdAt })
        })
            .sort({ createdAt: -1 })
            .limit(limit);

        const autoPayIds = autoSubs.map(s => s.autoPayOrderId);

        const autopays = await AutoPay.find({
            _id: { $in: autoPayIds }
        });

        autoPayHistory = autoSubs
            .map(sub => {
                const autopay = autopays.find(
                    a => String(a._id) === String(sub.autoPayOrderId)
                );

                if (!autopay) return null;

                return {
                    type: "AUTOPAY",

                    autopayId: autopay._id,

                    plan: {
                        from: sub.fromPlan,
                        to: sub.toPlan,
                        action: sub.action
                    },

                    amount: {
                        mandate: autopay.mandateAmount,
                        currency: autopay.currency
                    },

                    payment: {
                        gateway: autopay.gateway,
                        status: autopay.status,
                        nextChargeAt: autopay.nextChargeAt
                    },

                    metadata: {
                        ip: autopay.metadata?.ip,
                        isCurrent:
                            autopay.metadata?.deviceId === req.body.deviceId
                    },

                    subscription: {
                        carriedForwardDays: sub.carriedForwardDays,
                        isLifetime: sub.isLifetime
                    },

                    createdAt: sub.createdAt
                };
            })
            .filter(Boolean);
    }

    let history = [];

    if (type === "payment") {
        history = paymentHistory;
    } else if (type === "autopay") {
        history = autoPayHistory;
    } else {
        history = [...paymentHistory, ...autoPayHistory];
    }

    history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return sendResponse(res, 200, {
        count: history.length,
        history
    });
};
