import AutoPay from "../../../../models/subscription/AutoPay.model.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import { buildSubscriptionInfo } from "../../../../helpers/subscription/subscription.helper.js";

export const getSubscriptionStatus = async (req, res) => {
    const { currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);

    const autopay = await AutoPay.findOne({
        userId: currentProfile._id,
        status: { $in: ["active", "authenticated"] }
    });

    const now = new Date();

    const daysLeft = premium.expiresAt
        ? Math.max(
              0,
              Math.ceil(
                  (new Date(premium.expiresAt) - now) / (1000 * 60 * 60 * 24)
              )
          )
        : null;

    return sendResponse(res, 200, {
        isActive: premium.isActive,
        plan: premium.tier || "free",
        isTrial: premium.isTrial || false,
        expiresAt: premium.expiresAt,
        daysLeft,
        autopay: autopay
            ? {
                  enabled: true,
                  status: autopay.status,
                  nextChargeAt: autopay.nextChargeAt
              }
            : {
                  enabled: false
              },

        canCancel: !!autopay,
        canUpgrade: premium.tier !== "gold",
        canDowngrade: premium.tier === "gold"
    });
};
