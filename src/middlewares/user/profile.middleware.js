import sendResponse from "../../helpers/sendResponse.js";

import { findProfile } from "../../services/profile.service.js";

export const isProfileExists = async (req, res, next) => {
    const { user } = req.auth;
    const isExists = await findProfile({
        userId: user._id
    });

    if (!isExists) {
        return sendResponse(res, 404, {
            message: "Profile not found",
            next: "create_profile",
            route: "/profile/setup"
        });
    }

    req.auth.profileInfo = isExists;
    return next();
};
