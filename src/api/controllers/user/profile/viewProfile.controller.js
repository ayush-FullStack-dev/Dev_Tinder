import ProfileView from "../../../../models/ProfileView.model.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import {
    findProfile,
    updateProfile
} from "../../../../services/profile.service.js";
import {
    isGoldActive,
    isSilverActive,
    getBadges
} from "../../../../helpers/premium.helper.js";

import { isValidDate } from "../../../../helpers/time.js";

export const viewPublicProfile = async (req, res) => {
    const { logged, profile, currentProfile } = req.auth;

    if (profile.premium?.features?.incognito?.enabled) {
        return sendResponse(res, 404, { message: "Profile not found" });
    }

    const basicInfo = {
        username: profile.username,
        displayName: profile.displayName,
        bio: profile.bio || "",
        role: profile.role,
        tech_stack: profile.tech_stack,
        looking_for: profile.looking_for,
        experience_years: profile.experience_years,
        photos: [
            ...currentProfile.photos.map(p => ({
                id: p._id,
                url: p.url,
                isPrimary: false,
                createdAt: p.createdAt
            })),
            {
                id: "none",
                url: currentProfile.primaryPhoto.url,
                isPrimary: true,
                createdAt: currentProfile.primaryPhoto.createdAt
            }
        ],
        location: {
            city: profile.location.city,
            country: profile.location.country
        },
        badges: getBadges(profile.premium)
    };

    if (!logged) {
        return sendResponse(res, 200, {
            data: basicInfo,
            note: "Login to get more infos about"
        });
    }

    if (!currentProfile) {
        return sendResponse(res, 200, {
            data: basicInfo,
            note: "Complete your profile to interact"
        });
    }

    if (currentProfile.id === profile.id) {
        return sendResponse(res, 200, {
            data: {
                ...basicInfo,
                stats: {
                    likes: profile.stats.likes,
                    views: profile.stats.views
                },
                meta: {
                    isSelf: true
                }
            }
        });
    }

    if (currentProfile.premium?.features?.incognito?.enabled) {
        return sendResponse(res, 200, {
            data: {
                ...basicInfo,
                stats: {
                    likes: profile.stats.likes,
                    views: profile.stats.views
                }
            }
        });
    }

    if (isGoldActive(profile?.premium)) {
        await ProfileView.create({
            viewerUserId: currentProfile.id,
            viewedUserId: profile.id
        });
    }

    const updateInfo = await updateProfile(
        {
            _id: profile._id
        },
        {
            $inc: {
                "stats.views": 1
            }
        }
    );

    return sendResponse(res, 200, {
        data: {
            ...basicInfo,
            stats: {
                likes: updateInfo.stats.likes,
                views: updateInfo.stats.views
            }
        }
    });
};

export const getWhoViewdMe = async (req, res) => {
    const { currentProfile } = req.auth;
    let hasMore = false;
    if (!isGoldActive(currentProfile.premium)) {
        return sendResponse(res, 403, {
            message: "Upgrade to Gold to see who viewed your profile",
            requiredTier: "gold"
        });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query = {
        viewedUserId: currentProfile._id
    };

    if (req.query?.cursor) {
        if (!isValidDate(req.query.cursor)) {
            return sendResponse(res, 400, {
                success: false,
                message: "Invalid cursor"
            });
        }
        query.viewedAt = { $lt: new Date(req.query.cursor) };
    }

    const viewsInfo = await ProfileView.find(query)
        .sort({ viewedAt: -1, _id: -1 })
        .limit(limit + 1)
        .populate(
            "viewerUserId",
            "username photos primaryPhoto displayName role tech_stack location premium"
        );

    if (viewsInfo.length > limit) {
        hasMore = true;
        viewsInfo.pop();
    }

    const nextCursor =
        viewsInfo.length > 0 && hasMore
            ? viewsInfo[viewsInfo.length - 1].viewedAt
            : null;

    const response = {
        total: currentProfile.stats.views,
        views: [],
        pagination: {
            limit,
            hasMore,
            nextCursor
        }
    };

    for (const pepole of viewsInfo) {
        const alreadyWatch = response.views.findIndex(
            k => k.username === pepole.viewerUserId.username
        );

        if (alreadyWatch !== -1) {
            response.views[alreadyWatch].viewCount += 1;
            continue;
        }

        response.views.push({
            username: pepole.viewerUserId.username,
            displayName: pepole.viewerUserId.displayName,
            role: pepole.viewerUserId.role,
            tech_stack: pepole.viewerUserId.tech_stack,
            photos: [
                ...pepole.viewerUserId.photos.map(p => ({
                    id: p._id,
                    url: p.url,
                    isPrimary: false,
                    createdAt: p.createdAt
                })),
                {
                    id: "none",
                    url: pepole.viewerUserId.primaryPhoto.url,
                    isPrimary: true,
                    createdAt: pepole.viewerUserId.primaryPhoto.createdAt
                }
            ],
            location: {
                city: pepole.viewerUserId.location.city,
                country: pepole.viewerUserId.location.country
            },
            badges: getBadges(pepole.viewerUserId.premium),
            lastViewedAt: pepole.viewedAt,
            viewCount: 1
        });
    }

    return sendResponse(res, 200, response);
};
