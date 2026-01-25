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

import { isValidDate } from "../../../../helpers/time.js";

import {
    getBadges,
    buildSubscriptionInfo
} from "../../../../helpers/premium.helper.js";

import {
    setSession,
    getSession
} from "../../../../services/session.service.js";

import {
    allowedFreeLimit,
    allowedSilverLimit
} from "../../../../constants/premium.constant.js";

const buildProfileInfo = profile => {
    return {
        username: profile.username,
        displayName: profile.displayName,
        role: profile.role,
        tech_stack: profile.tech_stack,
        location: {
            city: profile.location?.city,
            country: profile.location?.country
        },
        photos: [
            {
                id: "none",
                url: profile.primaryPhoto.url,
                isPrimary: true,
                createdAt: profile.primaryPhoto.createdAt
            }
        ],
        score: profile._goldScore || profile._silverScore || profile._freeScore,
        badges: getBadges(profile.premium)
    };
};

export const getDiscover = async (req, res) => {
    const { user,currentProfile } = req.auth;
    let hasMore = false;

    const activeBatch = await getSession(
        `discover:active:${currentProfile._id}`
    );

    if (activeBatch) {
        return sendResponse(res, 409, {
            message: "Complete current batch first",
            code: "DISCOVER_BATCH_ACTIVE"
        });
    }

    const excludedIds = await getExcludedIds(currentProfile._id);

    const premiumInfo = buildSubscriptionInfo(currentProfile.premium);

    const response = {
        profiles: [],
        meta: {
            tier: premiumInfo?.tier,
            remainingToday: 0,
            unlimited: premiumInfo.tier === "gold" && premiumInfo.isActive
        }
    };

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
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        baseQuery.createdAt = { $lt: new Date(req.query.cursor) };
    }

    if (!premiumInfo?.isActive) {
        const seenCount = await ProfileSeen.countDocuments({
            viewerProfileId: currentProfile._id,
            seenAt: {
                $gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
        });

        if (seenCount >= allowedFreeLimit) {
            return sendResponse(res, 429, {
                message: "You’ve reached your daily profile limit",
                limit: allowedFreeLimit,
                tier: "free",
                upgradeHint: "Upgrade to Silver or Gold for more profiles",
                requiredTier: ["silver", "gold"],
                code: "PROFILE_LIMIT_REACHED"
            });
        }

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

        info = freeProfileScore(info, currentProfile, user);
        const remaining = [];

        for (const profile of info) {
            remaining.push(profile._id);
            response.profiles.push(buildProfileInfo(profile));
        }

        if (remaining.length) {
            await setSession(
                {
                    ip: req.realIp,
                    remaining
                },
                currentProfile._id,
                "discover:active",
                "EX",
                1800
            );
        }

        return sendResponse(res, 200, {
            ...response,
            pagination: pagination,
            meta: {
                tier: "free",
                remainingToday: Math.abs(allowedFreeLimit - seenCount)
            }
        });
    }

    if (premiumInfo?.tier === "silver") {
        const seenCount = await ProfileSeen.countDocuments({
            viewerProfileId: currentProfile._id,
            seenAt: {
                $gte: new Date(Date.now() - 1000 * 60 * 60 * 24)
            }
        });

        if (seenCount >= allowedSilverLimit) {
            return sendResponse(res, 429, {
                message: "You’ve reached your daily profile limit",
                limit: allowedSilverLimit,
                tier: premiumInfo?.tier,
                upgradeHint: "Upgrade to Gold for unlimited profiles",
                requiredTier: ["gold"],
                code: "PROFILE_LIMIT_REACHED"
            });
        }

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

        const remaining = [];

        for (const profile of info) {
            remaining.push(profile._id);
            response.profiles.push(buildProfileInfo(profile));
        }

        if (remaining.length) {
            await setSession(
                {
                    ip: req.realIp,
                    remaining
                },
                currentProfile._id,
                "discover:active",
                "EX",
                1800
            );
        }

        return sendResponse(res, 200, {
            ...response,
            pagination: pagination,
            meta: {
                tier: premiumInfo?.tier,
                remainingToday: Math.abs(allowedSilverLimit - seenCount)
            }
        });
    }

    const goldQuery = goldProfileQuery(req.query);
    const maxDistance = req.query?.maxDistance
        ? Math.min(Number(req.query.maxDistance), 100000)
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
    const remaining = [];

    for (const profile of info) {
        remaining.push(profile._id);
        response.profiles.push(buildProfileInfo(profile));
    }

    if (remaining.length) {
        await setSession(
            {
                ip: req.realIp,
                remaining
            },
            currentProfile._id,
            "discover:active",
            "EX",
            1800
        );
    }

    return sendResponse(res, 200, {
        ...response,
        pagination: pagination,
        meta: {
            tier: premiumInfo?.tier,
            remainingToday: null
        }
    });
};

export const getOldDiscover = async (req, res) => {
    const { currentProfile } = req.auth;
    const oldProfiles = [];

    const activeBatch = await getSession(
        `discover:active:${currentProfile._id}`
    );

    if (!activeBatch) {
        return sendResponse(res, 404, {
            message: "No active discover batch found. Start a new batch first.",
            code: "DISCOVER_BATCH_NOT_FOUND"
        });
    }

    if (activeBatch?.ip !== req.realIp) {
        return sendResponse(res, 403, {
            message: "Access denied. Discover batch session mismatch.",
            code: "DISCOVER_BATCH_FORBIDDEN"
        });
    }

    const profiles = await Profile.find({
        _id: { $in: activeBatch.remaining }
    });

    for (const profileInfo of profiles) {
        oldProfiles.push(buildProfileInfo(profileInfo));
    }

    return sendResponse(res, 200, {
        message: "Old discover profiles fetched successfully.",
        profiles: oldProfiles
    });
};
