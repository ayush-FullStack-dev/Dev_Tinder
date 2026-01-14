import ProfileLike from "../../../../models/ProfileLike.model.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import {
    findProfile,
    updateProfile
} from "../../../../services/profile.service.js";

import {
    isGoldActive,
    isSilverActive,
    getBadges,
    buildSubscriptionInfo
} from "../../../../helpers/premium.helper.js";

import { isValidDate } from "../../../../helpers/time.js";

const getBasicDetailes = likedByUserId => {
    return {
        username: likedByUserId.username,
        displayName: likedByUserId.displayName,
        role: likedByUserId.role,
        tech_stack: likedByUserId.tech_stack,
        location: {
            city: likedByUserId.location.city,
            country: likedByUserId.location.country
        },
        badges: getBadges(likedByUserId.premium),
        blurred: false
    };
};

export const likePublicProfile = async (req, res) => {
    const { profile, currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);

    const alreadyLiked = await ProfileLike.findOne({
        likedProfileUserId: profile._id,
        likedByUserId: currentProfile._id
    });

    if (alreadyLiked) {
        return sendResponse(res, 200, {
            message: "Already Profile liked",
            data: {
                username: profile.username,
                liked: true
            }
        });
    }

    if (currentProfile.id === profile.id) {
        return sendResponse(res, 200, "You cannot like your own profile");
    }

    if (!premium.isActive) {
        const totalLiked = await ProfileLike.countDocuments({
            likedByUserId: currentProfile._id,

            likedAt: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        });

        if (totalLiked > 30) {
            return sendResponse(res, 429, {
                message: "You’ve reached your daily profile like limit",
                limit: 30,
                tier: "free",
                upgradeHint: "Upgrade to Silver or Gold for unlimited likes",
                requiredTier: ["silver", "gold"],
                code: "LIKE_LIMIT_REACHED"
            });
        }
    }

    await ProfileLike.create({
        likedByUserId: currentProfile._id,
        likedProfileUserId: profile._id
    });

    const updateInfo = await updateProfile(
        {
            _id: profile._id
        },
        {
            $inc: {
                "stats.likes": 1
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Profile liked",
        data: {
            username: updateInfo.username,
            liked: true,
            stats: {
                likes: updateInfo.stats.likes
            }
        }
    });
};

export const unlikePublicProfile = async (req, res) => {
    const { profile, currentProfile } = req.auth;

    const alreadyLiked = await ProfileLike.findOne({
        likedProfileUserId: profile._id,
        likedByUserId: currentProfile._id
    });

    if (!alreadyLiked) {
        return sendResponse(res, 200, {
            message: "Profile was not liked",
            data: {
                username: profile.username,
                liked: false
            }
        });
    }

    const { deletedCount } = await ProfileLike.deleteMany({
        likedProfileUserId: profile._id,
        likedByUserId: currentProfile._id
    });

    const updateInfo = await updateProfile(
        {
            _id: profile._id
        },
        {
            $inc: {
                "stats.likes": -deletedCount
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Like removed",
        data: {
            username: updateInfo.username,
            liked: false,
            stats: {
                likes: updateInfo.stats.likes
            }
        }
    });
};

export const getWhoLikedProfile = async (req, res) => {
    const { currentProfile } = req.auth;
    let hasMore = false;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const premiumInfo = buildSubscriptionInfo(currentProfile.premium);
    const query = {
        likedProfileUserId: currentProfile._id
    };

    if (!premiumInfo.isActive && premiumInfo.tier !== "gold") {
        return sendResponse(res, 403, {
            message: "Upgrade to Gold to see who liked your profile",
            requiredTier: ["gold"]
        });
    }

    if (req.query?.cursor && premiumInfo.tier === "gold") {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.likedAt = { $lt: new Date(req.query.cursor) };
    }

    const likesInfos = await ProfileLike.find(query)
        .sort({ likedAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate(
            "likedByUserId",
            "username displayName role tech_stack location premium"
        );

    if (likesInfos.length > limit) {
        hasMore = true;
        likesInfos.pop();
    }

    const nextCursor =
        likesInfos.length > 0 && hasMore
            ? likesInfos[likesInfos.length - 1].likedAt
            : null;

    const response = {
        likes: [],
        pagination: { limit, hasMore, nextCursor }
    };

    for (const people of likesInfos) {
        const basicInfo = getBasicDetailes(people.likedByUserId);

        response.likes.push({
            ...basicInfo,
            likedAt: people.likedAt
        });
    }

    return sendResponse(res, 200, response);
};
