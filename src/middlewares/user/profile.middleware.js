import sendResponse from "../../helpers/sendResponse.js";

import { findProfile, updateProfile } from "../../services/profile.service.js";

export const isProfileExists = async (req, res, next) => {
    const { user } = req.auth;
    const profile = await findProfile({
        userId: user._id
    });

    if (!profile) {
        return sendResponse(res, 404, {
            message: "Profile not found",
            next: "create_profile",
            route: "/profile/setup"
        });
    }

    req.auth.currentProfile = profile;
    return next();
};

export const optionalProfile = async (req, res, next) => {
    const { logged, info } = req.auth;
    if (!logged) {
        return next();
    }

    const profile = await findProfile({
        userId: info?._id
    });

    req.auth.currentProfile = profile;
    return next();
};

export const checkPremiumStatus = async (req, res, next) => {
    const profile = req.auth.currentProfile;

    if (
        profile &&
        profile.premium?.type !== "free" &&
        !profile.premium?.isLifetime &&
        profile.premium?.expiresAt &&
        profile.premium.expiresAt < Date.now()
    ) {
        const profileInfo = await updateProfile(
            { _id: profile._id },
            {
                $set: {
                    "premium.type": "free",
                    "premium.since": null,
                    "premium.expiresAt": null
                }
            }
        );

        req.auth.currentProfile = profileInfo;
    }

    return next();
};
