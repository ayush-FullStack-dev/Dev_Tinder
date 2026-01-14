import ProfileSeen from "../../models/ProfileSeen.model.js";
import sendResponse from "../../helpers/sendResponse.js";

import { buildSubscriptionInfo } from "../../helpers/premium.helper.js";

import {
    setSession,
    getSession,
    removeKeys
} from "../../services/session.service.js";

import {
    allowedSilverLimit,
    allowedFreeLimit
} from "../../constants/premium.constant.js";

export const swipeProfile = async (req, res, next) => {
    const { profile, currentProfile } = req.auth;
    const premium = buildSubscriptionInfo(currentProfile.premium);
    const isGoldUser = premium.isActive && premium.tier === "gold";
    let seenCount = 0;

    const activeBatch = await getSession(
        `discover:active:${currentProfile._id}`
    );

    if (!activeBatch) {
        return sendResponse(res, 404, {
            message: "No active discover batch found. Start a new batch first.",
            code: "DISCOVER_BATCH_NOT_FOUND"
        });
    }

    if (profile.id === currentProfile.id) {
        return sendResponse(res, 400, {
            message: "You cannot swipe your own profile",
            code: "CANNOT_SWIPE_SELF"
        });
    }

    if (!activeBatch.remaining.includes(profile.id)) {
        return sendResponse(res, 403, {
            message:
                "Invalid swipe request. This profile is not in your active feed.",
            code: "INVALID_DISCOVER_FLOW",
            action: "refresh_feed",
            route: "/discover",
            hint: "Refresh your feed and swipe again."
        });
    }

    activeBatch.remaining = activeBatch.remaining.filter(k => k !== profile.id);

    if (activeBatch.remaining.length === 0) {
        await removeKeys(`discover:active:${currentProfile._id}`);
    } else {
        await setSession(
            activeBatch,
            currentProfile.id,
            "discover:active",
            "XX",
            "EX",
            1800
        );
    }

    const isSwipped = await ProfileSeen.exists({
        viewerProfileId: currentProfile._id,
        seenProfileId: profile._id
    });

    if (isSwipped?.action === "like") {
        return sendResponse(res, 409, {
            message: "You have already liked this profile",
            code: "ALREADY_LIKED",
            data: {
                username: profile.username,
                action: "like",
                liked: true
            }
        });
    }
    if (isSwipped?.action === "pass") {
        return sendResponse(res, 409, {
            message: "Already passed",
            data: {
                username: profile.username,
                action: "pass",
                passed: true
            }
        });
    }

    if (!isGoldUser) {
        seenCount = await ProfileSeen.countDocuments({
            viewerProfileId: currentProfile._id,
            seenAt: {
                $gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
        });
    }

    if (!premium.isActive && seenCount >= allowedFreeLimit) {
        return sendResponse(res, 429, {
            message: "You’ve reached your daily profile limit",
            limit: allowedFreeLimit,
            tier: "free",
            upgradeHint: "Upgrade to Silver or Gold for more profiles",
            requiredTier: ["silver", "gold"],
            code: "PROFILE_LIMIT_REACHED"
        });
    }

    if (premium.tier === "silver" && seenCount >= allowedSilverLimit) {
        return sendResponse(res, 429, {
            message: "You’ve reached your daily profile limit",
            limit: allowedSilverLimit,
            tier: premiumInfo?.tier,
            upgradeHint: "Upgrade to Gold for unlimited profiles",
            requiredTier: ["gold"],
            code: "PROFILE_LIMIT_REACHED"
        });
    }

    req.auth.premiumInfo = premium;
    return next();
};
