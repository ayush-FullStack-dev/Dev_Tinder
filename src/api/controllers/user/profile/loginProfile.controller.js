import sendResponse from "../../../../helpers/sendResponse.js";

import {
    isGoldActive,
    isSilverActive,
    buildSubscriptionInfo,
    getBadges
} from "../../../../helpers/premium.helper.js";
import { checkValidation } from "../../../../helpers/helpers.js";

import { profilePatchValidator } from "../../../../validators/user/profile.validator.js";
import { updateProfileDeleteInfo } from "./../../../../helpers/profile.helper.js";

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
            badges: getBadges(currentProfile.premium),
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

export const updateProfileInfo = async (req, res) => {
    const { currentProfile } = req.auth;

    const ALLOWED_FIELDS = [
        "displayName",
        "bio",
        "tech_stack",
        "looking_for",
        "experience_years",
        "visibility",
        "location"
    ];

    const isValidInfo = checkValidation(
        profilePatchValidator,
        req,
        "Invalid profile data"
    );

    if (!isValidInfo?.success) {
        return sendResponse(res, 400, isValidInfo.jsonResponse);
    }

    const updates = {};

    for (const field of ALLOWED_FIELDS) {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    }

    if (Object.keys(updates).length === 0) {
        return sendResponse(
            res,
            400,
            `No valid fields to update ALLOWED_FIELDS ${ALLOWED_FIELDS.join(
                " , "
            )}`
        );
    }

    const updatedProfile = await updateProfile(
        currentProfile._id,
        { $set: updates },
        { id: true }
    );

    return sendResponse(res, 200, {
        message: "Profile updated successfully",
        data: {
            username: updatedProfile.username,
            displayName: updatedProfile.displayName,
            bio: updatedProfile.bio,
            tech_stack: updatedProfile.tech_stack,
            looking_for: updatedProfile.looking_for,
            experience_years: updatedProfile.experience_years,
            location: {
                city: updatedProfile.location.city,
                country: updatedProfile.location.country
            },
            visibility: updatedProfile.visibility,
            updatedAt: updatedProfile.updatedAt
        },
        updatedFields: [...Object.keys(updates)],
        version: updatedProfile.__v
    });
};

export const changeProfileVisiblity = async (req, res) => {
    const { currentProfile } = req.auth;

    const nextVisibility =
        currentProfile.visibility === "public" ? "hidden" : "public";

    const updatedProfile = await updateProfile(
        currentProfile._id,
        { visibility: nextVisibility },
        { id: true }
    );

    return sendResponse(res, 200, {
        message: "Profile visibility updated",
        data: {
            visibility: updatedProfile.visibility
        }
    });
};

export const deleteProfile = async (req, res) => {
    const { currentProfile } = req.auth;

    const gracePeriodTime = Date.now() + 1000 * 60 * 60 * 24 * 30;

    if (currentProfile.deletedAt) {
        return sendResponse(res, 409, {
            message: "Account is already scheduled for deletion",
            data: {
                restoreUntil: new Date(currentProfile.deletedAt)
            },
            code: "ALREADY_SCHEDULED"
        });
    }

    await updateProfileDeleteInfo(currentProfile, gracePeriodTime);

    return sendResponse(res, 200, {
        message: "Account scheduled for deletion",
        data: {
            gracePeriodDays: 30,
            restoreUntil: new Date(gracePeriodTime)
        }
    });
};

export const restoreProfile = async (req, res) => {
    const { currentProfile } = req.auth;

    if (!currentProfile.deletedAt) {
        return sendResponse(res, 400,{
  
  "message": "Account is not scheduled for deletion",
  "code": "NOT_IN_DELETE_STATE"
})
    }

    await updateProfileDeleteInfo(currentProfile, null);

    return sendResponse(res, 200, {
        message: "Account restored successfully",
        data: {
            status: "active",
            restoredAt: new Date()
        }
    });
};

export const getProfileStats = (req, res) => {
    const { currentProfile } = req.auth;

    return sendResponse(res, 200, {
        data: {
            likes: currentProfile.stats.likes || 0,
            views: currentProfile.stats.views || 0,
            matches: currentProfile.stats.matches || 0,
            profileScore: currentProfile.profileScore || 0
        }
    });
};
