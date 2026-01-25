import sendResponse from "../../../../helpers/sendResponse.js";
import ProfileSeen from "../../../../models/ProfileSeen.model.js";
import ProfileLike from "../../../../models/ProfileLike.model.js";
import Match from "../../../../models/Match.model.js";
import redis from "../../../../config/redis.js";

import {
    getBadges,
    buildSubscriptionInfo
} from "../../../../helpers/premium.helper.js";
import {
    rewindLimit,
    premiumRewindLimit
} from "../../../../constants/premium.constant.js";
import {
    blurBoyImage,
    blurGirlImage,
    blurNeutralImage
} from "../../../../constants/url.constant.js";
import { paginationInfos } from "../../../../helpers/pagination.helper.js";
import { isValidDate, europeanStyleDate } from "../../../../helpers/time.js";

const getBasicDetailes = likedByUserId => {
    return {
        username: likedByUserId.username,
        displayName: likedByUserId.displayName,
        role: likedByUserId.role,
        tech_stack: likedByUserId.tech_stack,
        photos: [
            ...likedByUserId.photos.map(p => ({
                id: p._id,
                url: p.url,
                isPrimary: false,
                createdAt: p.createdAt
            })),
            {
                id: "none",
                url: likedByUserId.primaryPhoto.url,
                isPrimary: true,
                createdAt: likedByUserId.primaryPhoto.createdAt
            }
        ],
        location: {
            city: likedByUserId.location.city,
            country: likedByUserId.location.country
        },
        badges: getBadges(likedByUserId.premium),
        blurred: false
    };
};

export const leftSwipeProfile = async (req, res) => {
    const { profile, currentProfile, premiumInfo } = req.auth;
    const isGoldUser = premiumInfo.isActive && premiumInfo.tier === "gold";

    await ProfileSeen.create({
        viewerProfileId: currentProfile._id,
        seenProfileId: profile._id,
        action: "pass"
    });

    return sendResponse(res, 200, {
        message: "Profile passed",
        data: {
            username: profile.username,
            action: "pass",
            passed: true
        },
        meta: {
            tier: premiumInfo.isActive ? premiumInfo.tier : "free",
            unlimited: isGoldUser
        }
    });
};

export const rightSwipeProfile = async (req, res) => {
    const { profile, currentProfile, premiumInfo } = req.auth;
    const isGoldUser = premiumInfo.isActive && premiumInfo.tier === "gold";

    const totalSwipes = await ProfileSeen.countDocuments({
        viewerProfileId: currentProfile._id,
        action: "like",
        seenAt: {
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
    });

    if (!premiumInfo.isActive && totalSwipes >= 15) {
        return sendResponse(res, 429, {
            message: "You’ve reached your daily right swipe  limit",
            limit: 15,
            tier: "free",
            upgradeHint: "Upgrade to Silver or Gold for more right swipes",
            requiredTier: ["silver", "gold"],
            code: "RIGTH_SWIPE_LIMIT_REACHED"
        });
    }

    if (
        premiumInfo.isActive &&
        premiumInfo.tier === "silver" &&
        totalSwipes >= 50
    ) {
        return sendResponse(res, 429, {
            message: "You’ve reached your daily rigth swipes limit",
            limit: 50,
            tier: "silver",
            upgradeHint: "Upgrade to Gold for unlimited rigth swipes",
            requiredTier: ["gold"],
            code: "RIGTH_SWIPE_LIMIT_REACHED"
        });
    }

    const meta = {
        tier: premiumInfo.isActive ? premiumInfo.tier : "free",
        unlimited: isGoldUser
    };

    await ProfileSeen.create({
        viewerProfileId: currentProfile._id,
        seenProfileId: profile._id,
        action: "like"
    });

    const isMatch = await ProfileSeen.exists({
        viewerProfileId: profile._id,
        seenProfileId: currentProfile._id,
        action: "like"
    });

    if (!isMatch) {
        return sendResponse(res, 200, {
            message: "Profile Liked",
            data: {
                username: profile.username,
                action: "like",
                liked: true,
                match: false
            },
            meta
        });
    }

    const users = [currentProfile._id, profile._id].sort();
    const matchDoc = await Match.create({
        users,
        createdBy: currentProfile._id
    });
    const matchId = matchDoc._id;

    return sendResponse(res, 201, {
        message: "It's a match",
        data: {
            username: profile.username,
            action: "like",
            liked: true,
            match: true,
            matchId: matchId
        },
        meta: {
            ...meta,
            next: "open_chat",
            route: `/chat/${matchId}`
        }
    });
};

export const getWhoRightSwipe = async (req, res) => {
    const { user, currentProfile } = req.auth;
    let hasMore = false;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const premiumInfo = buildSubscriptionInfo(currentProfile.premium);
    const query = {
        seenProfileId: currentProfile._id,
        action: "like"
    };

    if (!premiumInfo.isActive) {
        return sendResponse(res, 403, {
            message:
                "Upgrade to Silver or Gold to see who right swipe your profile",
            requiredTier: ["silver", "gold"]
        });
    }

    if (req.query?.cursor && premiumInfo.tier === "gold") {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.seenAt = { $lt: new Date(req.query.cursor) };
    }

    const swipeInfos = await ProfileSeen.find(query)
        .sort({ seenAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate(
            "viewerProfileId",
            "username displayName role tech_stack location premium"
        );

    const { pagination, info } = paginationInfos(swipeInfos, limit, "seenAt");

    const response = {
        swipes: [],
        meta: {
            visible: 0,
            hidden: 0
        }
    };

    if (premiumInfo.tier === "gold") {
        response.pagination = pagination;
    }

    for (const people of info) {
        const basicInfo = getBasicDetailes(people.viewerProfileId);

        if (premiumInfo.tier === "gold") {
            response.meta.visible += 1;
            response.swipes.push({
                ...basicInfo,
                seenAt: people.seenAt
            });
            continue;
        }

        if (response.swipes.length >= 5) {
            response.swipes.push({
                username: "hidden",
                displayName: "Someone rigth swipe you",
                photos: [
                    {
                        url:
                            user.gender === "female"
                                ? blurBoyImage
                                : user.gender === "male"
                                ? blurGirlImage
                                : blurNeutralImage,
                        isPrimary: true,
                        createdAt: likedByUserId.primaryPhoto.createdAt
                    }
                ],
                role: people.viewerProfileId.role,
                blurred: true
            });
            response.meta.hidden += 1;
            response.meta.upgradeHint = "Unlock Gold to see all rigth swipes";
            response.meta.upgradeTier = "gold";
            continue;
        }

        response.meta.visible += 1;
        response.swipes.push(basicInfo);
    }

    return sendResponse(res, 200, response);
};

export const rewindOldSwipe = async (req, res) => {
    const { currentProfile } = req.auth;
    const key = `rewind:count:${currentProfile._id}:${europeanStyleDate()}`;
    const premium = buildSubscriptionInfo(currentProfile.premium);

    if (!premium.isActive && premium.tier !== "gold") {
        return sendResponse(res, 403, {
            success: false,
            message: "Rewind is available for Gold members only",
            requiredTier: ["gold"],
            code: "PREMIUM_REQUIRED"
        });
    }

    const count = await redis.incr(key);

    if (count === 1) {
        await redis.expire(key, 60 * 60 * 24);
    }

    if (!premium.isLifetime && count > rewindLimit) {
        return sendResponse(res, 429, {
            message: "Daily rewind limit reached",
            tier: "gold",
            limit: rewindLimit,
            upgradeHint: "Try again tomorrow",
            code: "REWIND_LIMIT_REACHED"
        });
    }

    if (premium.isLifetime && count > premiumRewindLimit) {
        return sendResponse(res, 429, {
            message: "Daily rewind limit reached for Lifetime Gold",
            tier: "gold",
            limit: premiumRewindLimit,
            note: "Lifetime Gold has a higher rewind limit, but it’s still capped per day to prevent abuse.",
            upgradeHint: "Try again tomorrow",
            code: "REWIND_LIMIT_REACHED_LIFETIME"
        });
    }

    const oldSwipe = await ProfileSeen.findOneAndDelete({
        viewerProfileId: currentProfile.id,
        action: "pass"
    })
        .sort({ seenAt: -1 })
        .populate("seenProfileId");

    if (!oldSwipe) {
        return sendResponse(res, 409, {
            message: "Nothing to rewind",
            code: "NOTHING_TO_REWIND"
        });
    }

    const profile = oldSwipe.seenProfileId;

    if (profile?.visibility !== "public") {
        return sendResponse(res, 200, {
            message: "Rewind successful, but profile is no longer available",
            data: {
                action: "rewind",
                restoredProfile: null
            }
        });
    }

    return sendResponse(res, 200, {
        message: "Rewind successful",
        data: {
            action: "rewind",
            restoredProfile: {
                username: profile.username,
                displayName: profile.displayName,
                role: profile.role,
                photos: [
                    {
                        id: "none",
                        url: profile.primaryPhoto.url,
                        isPrimary: true,
                        createdAt: profile.primaryPhoto.createdAt
                    }
                ],
                tech_stack: profile.tech_stack,
                location: {
                    city: profile.location.city,
                    country: profile.location.country
                },
                badges: getBadges(profile.premium)
            }
        },
        meta: {
            tier: "gold",
            rewindRemainingToday: rewindLimit - count
        }
    });
};
