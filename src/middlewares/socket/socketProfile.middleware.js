import ApiError from "../../helpers/ApiError.js";
import { findProfile } from "../../services/profile.service.js";

export const socketProfile = async (socket, next) => {
    const decoded = socket.user.auth;

    if (!decoded) {
        return next(
            new ApiError(
                "InternalServerError",
                "Middleware wrong placement",
                500
            )
        );
    }

    const profile = await findProfile({ userId: decoded._id });

    if (!profile) {
        return next(
            new ApiError("PROFILE_NOT_FOUND", "Profile not found", 404)
        );
    }

    if (profile.deletedAt) {
        return next(
            new ApiError(
                "PROFILE_DEACTIVATED",
                "Your profile is deactivated. Restore it within 30 days.",
                403
            )
        );
    }

    socket.user.currentProfile = profile;
    return next();
};
