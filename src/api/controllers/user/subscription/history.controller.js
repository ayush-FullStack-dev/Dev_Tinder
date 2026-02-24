import PaymentOrder from "../../../../models/subscription/PaymentOrder.model.js";
import Subscription from "../../../../models/subscription/Subscription.model.js";
import sendResponse from "../../../../helpers/sendResponse.js";

import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate } from "../../../../helpers/time.js";

export const subscriptionHistory = async (req, res, next) => {
    const { currentProfile } = req.auth;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query = {
        userId: currentProfile._id
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.createdAt = { $lt: new Date(req.query.cursor) };
    }

    const orderInfos = await PaymentOrder.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit + 1);

    const orderCount = await PaymentOrder.countDocuments({
        userId: currentProfile._id
    });

    const { pagination, info: orders } = paginationInfos(
        orderInfos,
        limit,
        "createdAt"
    );

    const orderIds = orders.map(u => u._id) || [];

    const subscriptions = await Subscription.find({
        paymentOrderId: {
            $in: orderIds
        }
    });

    const response = {
        count: orderCount,
        history: [],
        pagination
    };

    for (const order of orders) {
        const subscription = subscriptions.find(
            u => String(u.paymentOrderId) === String(order._id)
        );

        if (!subscription) {
            continue;
        }

        response.history.push({
            orderId: order._id,
            plan: {
                from: subscription.fromPlan,
                to: subscription.toPlan,
                action: subscription.action
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
                ip: order.metadata.ip,
                isCurrent: order.metadata.deviceId === req.body.deviceId
            },
            subscription: {
                carriedForwardDays: subscription.carriedForwardDays,
                isLifetime: subscription.isLifetime
            },
            createdAt: order.createdAt
        });
    }

    return sendResponse(res, 200, response);
};
