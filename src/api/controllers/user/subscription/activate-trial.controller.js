import AutoPay from "../../../../models/subscription/AutoPay.model.js";
import Subscription from "../../../../models/subscription/Subscription.model.js";
import cashfree from "../../../../config/cashfree.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { PLANS } from "../../../../constants/subscription/plans.constant.js";
import { buildSubscriptionInfo } from "../../../../helpers/subscription/subscription.helper.js";

export const activateTrial = async (req, res, next) => {
    const { currentProfile } = req.auth;
    const premium = buildSubscriptionInfo(currentProfile.premium);

    const alreadyTrail = await Subscription.exists({
        userId: currentProfile._id,
        isTrial: true,
        action: "PURCHASE"
    });

    if (alreadyTrail) {
        return sendResponse(res, 403, {
            code: "TRIAL_ALREADY_USED",
            message: "You have already used your free trial"
        });
    }

    if (premium.isActive && premium.tier === "gold") {
        return sendResponse(res, 400, {
            code: "ALREADY_PREMIUM",
            message: "Trial is only available for free users"
        });
    }

    req.auth = {
        ...req.auth,
        method: req.body.method,
        premium,
        plan: PLANS["GOLD"]
    };

    return next();
};

export const createAutopay = async (req, res, next) => {
    const { user, currentProfile, premium, plan } = req.auth;
    const d = new Date();
    let nextMonth = new Date(d);
    let nextYear = new Date(d);
    const baseAmonut = 0;
    const actualPrice = plan.price;

    const response = await cashfree.PGCreateOrder({
        order_amount: 1,
        order_currency: "INR",
        customer_details: {
            customer_id: currentProfile._id.toString(),
            customer_name: currentProfile.displayName,
            customer_email: user.email,
            customer_phone: currentProfile.phone.mobile
        },
        order_meta: {
            return_url: `https://${process.env.DOMAIN}/subscription/processing/`,
            notify_url: `https://${process.env.DOMAIN}/subscription/webhook/autopay/`
        },
        mandate: {
            mandate_amount: actualPrice,
            mandate_currency: "INR",
            mandate_frequency: "MONTHLY",
            mandate_max_amount: actualPrice,
            mandate_start_date: new Date(
                nextMonth.setMonth(nextMonth.getMonth() + 1)
            ),
            mandate_end_date: new Date(
                nextYear.setFullYear(nextYear.getFullYear() + 1)
            )
        },
        order_tags: {
            subscription: "true"
        }
    });

    const cashfreeSubscription = response.data;

    const autoPay = await AutoPay.create({
        userId: currentProfile._id,
        gatewaySubscriptionId: cashfreeSubscription.order_id,
        isTrial: true,
        nextChargeAt: new Date(nextMonth.setMonth(nextMonth.getMonth() + 1)),
        mandateAmount: actualPrice,
        metadata: {
            ip: req.realIp,
            userAgent: req.headers["user-agent"],
            deviceId: req.body.deviceId
        }
    });

    await Subscription.create({
        userId: currentProfile._id,
        autoPayOrderId: autoPay._id,
        isTrial: true,
        action: "PURCHASE",
        fromPlan: premium.isActive ? premium.tier : "free",
        toPlan: plan.id.toLowerCase(),
        carriedForwardDays: 30
    });

    req.auth.order = autoPay;
    req.auth.cashfreeOrder = cashfreeSubscription;
    return next();
};
