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

export const viewPublicProfile = async (req, res) => {
    const { logged, currentProfile } = req.auth;

    const profileInfo = await findProfile({
        username: req.params?.username
    });

    if (!profileInfo || profileInfo.visibility !== "public") {
        return sendResponse(res, 404, "Profile not found");
    }

    const basicInfo = {
        username: profileInfo.username,
        displayName: profileInfo.displayName,
        bio: profileInfo.bio || "",
        role: profileInfo.role,
        tech_stack: profileInfo.tech_stack,
        looking_for: profileInfo.looking_for,
        experience_years: profileInfo.experience_years,
        location: {
            city: profileInfo.location.city,
            country: profileInfo.location.country
        },
        badges: getBadges(profileInfo.premium)
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

    if (currentProfile.id === profileInfo.id) {
        return sendResponse(res, 200, {
            data: {
                ...basicInfo,
                stats: {
                    likes: profileInfo.stats.likes,
                    views: profileInfo.stats.views
                },
                meta: {
                    isSelf: true
                }
            }
        });
    }

    if (isGoldActive(profileInfo?.premium)) {
        await ProfileView.create({
            viewerUserId: currentProfile.id,
            viewedUserId: profileInfo.id
        });
    }

    const updateInfo = await updateProfile(
        {
            _id: profileInfo._id
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

    if (!isGoldActive(currentProfile.premium)) {
        return sendResponse(res, 403, {
            message: "Upgrade to Gold to see who viewed your profile",
            requiredTier: "gold"
        });
    }

    const viewsInfo = await ProfileView.find({
        viewedUserId: currentProfile._id
    }).populate(
        "viewerUserId",
        "username displayName role tech_stack location premium"
    );

    const response = {
        total: 0,
        views: []
    };

    for (const pepole of viewsInfo) {
        const { username, displayName, role, tech_stack, location, premium } =
            pepole.viewerUserId;
        response.views.push({
            username: pepole.viewerUserId.username,
            displayName: pepole.viewerUserId.displayName,
            role: pepole.viewerUserId.role,
            tech_stack: pepole.viewerUserId.tech_stack,
            location: {
                city: pepole.viewerUserId.location.city,
                country: pepole.viewerUserId.location.country
            },
            badges: getBadges(pepole.viewerUserId.premium),
            viewedAt: viewsInfo.viewedAt
        });
        response.total += 1;
    }

    
    return sendResponse(res, 200, response);
};
