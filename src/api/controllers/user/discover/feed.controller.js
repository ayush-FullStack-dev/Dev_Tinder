import sendResponse from "../../../../helpers/sendResponse.js";

import ProfileSeen from "../../../../models/ProfileSeen.model.js";
import Profile from "../../../../models/Profile.model.js";

import {
    getExcludedIds,
    goldProfileScore,
    freeProfileScore,
    silverProfileScore,
    goldProfileQuery
} from "../../../../helpers/discover.helper.js";
import {
    paginationInfos,
    queryLimit
} from "../../../../helpers/pagination.helper.js";

import {
    getBadges,
    buildSubscriptionInfo
} from "../../../../helpers/premium.helper.js";

import {
    allowedFreeLimit,
    allowedSilverLimit
} from "../../../../constants/premium.constant.js";

const buildProfileInfo = profile => ({
    username: profile.username,
    displayName: profile.displayName,
    role: profile.role,
    tech_stack: profile.tech_stack,
    location: {
        city: profile.location.city,
        country: profile.location.country
    },
    score: profile?._silverScore || profile?._goldScore,
    badges: getBadges(profile.premium)
});

export const getDiscover = async (req, res) => {
    const { currentProfile } = req.auth;
    let hasMore = false;
    const response = {
        profiles: [],
        meta: {
            tier: "free",
            remainingToday: "0"
        }
    };
    const excludedIds = await getExcludedIds(currentProfile._id);
    const premiumInfo = buildSubscriptionInfo(currentProfile.premium);
    const limit = queryLimit(req.query?.limit, premiumInfo);

    const baseQuery = {
        userId: { $ne: currentProfile.userId },
        visibility: "public",
        _id: {
            $nin: excludedIds
        }
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return {
                success: false,
                message: "Invalid cursor"
            };
        }
        baseQuery.createdAt = { $lt: new Date(cursor) };
    }

    if (!premiumInfo?.isActive) {
        const profiles = await Profile.find(baseQuery)
            .sort({
                profileScore: -1,
                createdAt: -1
            })
            .limit(limit + 1);
        let { pagination, info } = paginationInfos(
            profiles,
            limit,
            "createdAt"
        );

        info = freeProfileScore(info, currentProfile);

        const count = await ProfileSeen.countDocuments({
            viewerProfileId: currentProfile._id,
            seenAt: {
                $gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
        });

        if (count > allowedFreeLimit) {
            return sendResponse(res, 429, {
                message: "You’ve reached your daily profile limit",
                limit: allowedFreeLimit,
                tier: "free",
                upgradeHint: "Upgrade to Silver or Gold for more profiles",
                requiredTier: ["silver", "gold"],
                code: "PROFILE_LIMIT_REACHED"
            });
        }

        for (const profile of info) {
            response.profiles.push(buildProfileInfo(profile));
        }

        return sendResponse(res, 200, {
            ...response,
            pagination: pagination,
            meta: {
                tier: "free",
                remainingToday: Math.abs(allowedFreeLimit - limit)
            }
        });
    }

    if (premiumInfo?.tier === "silver") {
        const profiles = await Profile.find(baseQuery)
            .sort({
                profileScore: -1,
                createdAt: -1
            })
            .limit(limit + 1);

        let { pagination, info } = paginationInfos(
            profiles,
            limit,
            "createdAt"
        );

        info = silverProfileScore(info, currentProfile);

        const count = await ProfileSeen.countDocuments({
            viewerProfileId: currentProfile._id,
            seenAt: {
                $gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
        });

        if (count > allowedSilverLimit) {
            return sendResponse(res, 429, {
                message: "You’ve reached your daily profile limit",
                limit: allowedSilverLimit,
                tier: premiumInfo?.tier,
                upgradeHint: "Upgrade to Gold for unlimited profiles",
                requiredTier: ["gold"],
                code: "PROFILE_LIMIT_REACHED"
            });
        }

        for (const profile of info) {
            response.profiles.push(buildProfileInfo(profile));
        }

        return sendResponse(res, 200, {
            ...response,
            pagination: pagination,
            meta: {
                tier: premiumInfo?.tier,
                remainingToday: Math.abs(allowedSilverLimit - limit)
            }
        });
    }

    const goldQuery = goldProfileQuery(req.query);
    const maxDistance = req.query?.maxDistance
        ? Math.min(Number(query.maxDistance), 100000)
        : 50000;

    
    const profiles = await Profile.aggregate([
        {
            $geoNear: {
                near: {
                    type: "Point",
                    coordinates: currentProfile.location.geo.coordinates
                },
                key: "location.geo",
                distanceField: "distance",
                maxDistance: maxDistance,
                spherical: true,
                query: { ...baseQuery, ...goldQuery }
            }
        },
        {
            $sort: {
                profileScore: -1,
                createdAt: -1
            }
        },
        { $limit: limit + 1 }
    ]);

    let { pagination, info } = paginationInfos(profiles, limit, "createdAt");
    info = goldProfileScore(info, currentProfile);

    for (const profile of info) {
        response.profiles.push(buildProfileInfo(profile));
    }

    return sendResponse(res, 200, {
        ...response,
        pagination: pagination,
        meta: {
            tier: premiumInfo?.tier,
            remainingToday: "unlimited"
        }
    });
};
