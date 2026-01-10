
import sendResponse from "../../../../helpers/sendResponse.js";

import {
    isGoldActive,
    isSilverActive,
    buildSubscriptionInfo,
    getBadges
} from "../../../../helpers/premium.helper.js";

export const loginProfileInfo = async (req, res) => {
    const { currentProfile } = req.auth;

    return sendResponse(res, 200, {
        data: {
            username: currentProfile.username,
            displayName: currentProfile.displayName,
            bio: currentProfile.bio,
            role: currentProfile.role,
            tech_stack: currentProfile.tech_stack,
            looking_for: currentProfile.looking_for,
            experience_years: currentProfile.experience_years,
            location: {
                city: currentProfile.location.city,
                country: currentProfile.location.country
            },
            visibility: currentProfile.visibility,
            profileScore: currentProfile.profileScore,
            badges: getBadges(currentProfile.premium)
,
            subscription: buildSubscriptionInfo(currentProfile.premium),
            stats: {
                likes: currentProfile.stats.likes,
                views: currentProfile.stats.views
            },
            createdAt: currentProfile.createdAt,
            updatedAt: currentProfile.updatedAt
        }
    });
};

