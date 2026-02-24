import AutoPay from "../../../../../../models/subscription/AutoPay.model.js";
import Subscription from "../../../../../../models/subscription/Subscription.model.js";

import sendResponse from "../../../../../../helpers/sendResponse.js";
import { PLANS } from "../../../../../../constants/subscription/plans.constant.js";
import { updateProfile } from "../../../../../../services/profile.service.js";

export const handleAutoPayWebhook = async (req, res, next) => {
    const { event, payload } = req.auth.value;

    const subscriptionEntity = payload.subscription?.entity;
    const invoiceEntity = payload.invoice?.entity;

    const subscriptionId =
        subscriptionEntity?.id || invoiceEntity?.subscription_id;

    if (!subscriptionId) {
        return sendResponse(res, 200);
    }

    const autopay = await AutoPay.findOneAndUpdate(
        {
            gatewaySubscriptionId: subscriptionId
        },
        {
            expiresAt: null
        }
    );

    if (!autopay) {
        return sendResponse(res, 200);
    }

    if (event === "subscription.authenticated") {
        await AutoPay.updateOne(
            { _id: autopay._id },
            {
                status: "authenticated",
                expiresAt: null
            }
        );

        return sendResponse(res, 200);
    }

    if (event === "subscription.activated") {
        await AutoPay.updateOne(
            { _id: autopay._id },
            {
                status: "active",
                nextChargeAt: new Date(subscriptionEntity.current_end * 1000)
            }
        );

        req.auth.autopay = autopay;
        req.auth.invoice = invoiceEntity;

        return next();
    }

    if (event === "invoice.paid") {
        req.auth.autopay = autopay;
        req.auth.invoice = invoiceEntity;

        return next();
    }

    if (event === "invoice.payment_failed") {
        await AutoPay.updateOne({ _id: autopay._id }, { status: "paused" });

        return sendResponse(res, 200);
    }

    return sendResponse(res, 200);
};

export const handleAutoPaySuccess = async (req, res) => {
    const { autopay, invoice } = req.auth;
    const { event } = req.auth.value;

    const subscription = await Subscription.findOne({
        autoPayOrderId: autopay._id
    });

    if (!subscription) {
        return sendResponse(res, 200);
    }

    if (event === "invoice.paid") {
        await Subscription.create({
            userId: currentProfile._id,
            autoPayOrderId: aotuPay._id,
            type: "paid",
            action: "PURCHASE",
            fromPlan: premium.isActive ? premium.tier : "free",
            toPlan: plan.id.toLowerCase(),
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
            nextChargeAt: new Date(invoice.period_end * 1000)
        }
    );

    return sendResponse(res, 200);
};
