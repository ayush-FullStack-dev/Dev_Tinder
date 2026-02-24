import AutoPay from "../../../../../../models/subscription/AutoPay.model.js";
import Subscription from "../../../../../../models/subscription/Subscription.model.js";

import sendResponse from "../../../../../../helpers/sendResponse.js";
import { PLANS } from "../../../../../../constants/subscription/plans.constant.js";
import { updateProfile } from "../../../../../../services/profile.service.js";

export const handleAutoPayWebhook = async (req, res, next) => {
    const { type, data } = req.auth.value;

    const subscription = data?.subscription;
    const payment = data?.payment;

    const subscriptionId =
        subscription?.subscription_id || payment?.subscription_id;

    if (!subscriptionId) {
        return sendResponse(res, 200);
    }

    const autopay = await AutoPay.findOneAndUpdate(
        { gatewaySubscriptionId: subscriptionId },
        { expiresAt: null }
    );

    if (!autopay) {
        return sendResponse(res, 200);
    }

    if (type === "SUBSCRIPTION_AUTHORIZED") {
        await AutoPay.updateOne(
            { _id: autopay._id },
            { status: "authenticated", expiresAt: null }
        );

        return sendResponse(res, 200);
    }

    if (type === "SUBSCRIPTION_ACTIVATED") {
        await AutoPay.updateOne(
            { _id: autopay._id },
            {
                status: "active",
                nextChargeAt: new Date(subscription.next_charge_time)
            }
        );

        req.auth.autopay = autopay;
        req.auth.subscription = subscription;

        return next();
    }

    if (type === "SUBSCRIPTION_CHARGED") {
        req.auth.autopay = autopay;
        req.auth.payment = payment;

        return next();
    }

    if (type === "SUBSCRIPTION_PAYMENT_FAILED") {
        await AutoPay.updateOne({ _id: autopay._id }, { status: "paused" });

        return sendResponse(res, 200);
    }

    return sendResponse(res, 200);
};

export const handleAutoPaySuccess = async (req, res) => {
    const { autopay, payment } = req.auth;
    const { type } = req.auth.value;

    const subscription = await Subscription.findOne({
        autoPayOrderId: autopay._id
    });

    if (!subscription) {
        return sendResponse(res, 200);
    }

    if (type === "SUBSCRIPTION_CHARGED") {
        await Subscription.create({
            userId: subscription.userId,
            autoPayOrderId: autopay._id,
            type: "paid",
            action: "PURCHASE",
            fromPlan: subscription.fromPlan,
            toPlan: subscription.toPlan,
            carriedForwardDays: 30
        });
    }

    const plan = PLANS[subscription.toPlan.toUpperCase()];
    const day = 1000 * 60 * 60 * 24;
    const expireIn = day * 30;

    await updateProfile(subscription.userId, {
        $inc: {
            "packs.benefits.boosts": plan.features.monthlyBoostCredits
        },
        $set: {
            premium: {
                type: subscription.toPlan,
                isLifetime: subscription.isLifetime,
                since: new Date(),
                subscriptionId: subscription._id,
                expiresAt: subscription.isLifetime
                    ? null
                    : new Date(Date.now() + expireIn)
            }
        }
    });

    await AutoPay.updateOne(
        { _id: autopay._id },
        {
            status: "active",
            nextChargeAt: new Date(payment.next_charge_time)
        }
    );

    return sendResponse(res, 200);
};
