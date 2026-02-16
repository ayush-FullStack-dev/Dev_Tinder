import sendResponse from "../../helpers/sendResponse.js";

import { buildSubscriptionInfo } from "../../helpers/subscription/subscription.helper.js";
import { updateProfile } from "../../services/profile.service.js";

const defaultConfig = {
    gold: false
};

export const isPremiumUser = (config = defaultConfig) => {
    return (req, res, next) => {
        const { currentProfile } = req.auth;
        const premiumInfo = buildSubscriptionInfo(currentProfile.premium);

        if (!premiumInfo.isActive) {
            return sendResponse(res, 403, {
                message: "Premium feature locked",
                code: "PREMIUM_REQUIRED",
                requiredTier: ["silver", "gold"],
                upgradeHint: "Upgrade to Silver or Gold to unlock this feature"
            });
        }

        if (config?.gold && premiumInfo.tier !== "gold") {
            return sendResponse(res, 403, {
                message: "Upgrade to Gold to access this feature",
                code: "PREMIUM_REQUIRED",
                requiredTier: ["gold"],
                upgradeHint: "Gold unlocks full access"
            });
        }

        req.auth.premiumInfo = premiumInfo;
        return next();
    };
};

export const checkPremiumStatus = async (req, res, next) => {
    const profile = req.auth.currentProfile;

    if (
        profile &&
        profile.premium?.type !== "free" &&
        !profile.premium?.isLifetime &&
        profile.premium?.expiresAt &&
        new Date(profile.premium.expiresAt).getTime() < Date.now()
    ) {
        const profileInfo = await updateProfile(
            { _id: profile._id },
            {
                $set: {
                    "premium.type": "free",
                    "premium.since": null,
                    "premium.expiresAt": null,
                    "premium.isLifetime": false
                }
            }
        );

        req.auth.currentProfile = profileInfo;
    }

    return next();
};

export const checkPacksStatus = async (req, res, next) => {
    const profile = req.auth.currentProfile;

    if (
        profile &&
        profile.packs.activePack !== "none" &&
        profile.packs.expiresAt &&
        new Date(profile.packs.expiresAt).getTime() < Date.now()
    ) {
        const profileInfo = await updateProfile(
            { _id: profile._id },
            {
                $set: {
                    "packs.activePack": "none",
                    "packs.benefits": {},
                    "packs.features": {},
                    "packs.expiresAt": null
                }
            }
        );

        req.auth.currentProfile = profileInfo;
    }

    return next();
};
