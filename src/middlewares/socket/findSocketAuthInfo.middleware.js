import { findUser } from "../../services/user.service.js";

import ApiError from "../../helpers/ApiError.js";

export const findSocketAuthInfo = async (socket, next) => {
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

    const user = await findUser({
        _id: decoded._id
    });

    if (!user) {
        return next(
            new ApiError(
                "ACCOUNT_DISABLED",
                "Your account no longer exists or has been disabled. Please login again.",
                403
            )
        );
    }

    socket.user.user = user;

    return next();
};
