import jwt from "jsonwebtoken";
import ApiError from "../../helpers/ApiError.js";
import cookie from "cookie";
import signature from "cookie-signature";

import { verifyAccesToken } from "../../helpers/token.js";

export const socketAuth = async (socket, next) => {
    try {
        const rawCookie = socket.handshake.headers.cookie;

        if (!rawCookie) {
            return next(new ApiError("UNAUTHORIZED", "No cookies found", 400));
        }

        const cookies = cookie.parse(rawCookie);
        const signedToken = cookies.accessToken;

        if (!signedToken) {
            return next(
                new ApiError(
                    "UNAUTHORIZED",
                    "Login is required to access resources",
                    403
                )
            );
        }

        const token = signature.unsign(
            signedToken.slice(2),
            process.env.COOKIE_SECRET
        );

        if (!token) {
            return next(
                new ApiError("UNAUTHORIZED", "Invalid signed cookie", 403)
            );
        }

        const decoded = verifyAccesToken(token);

        if (!decoded?.success) {
            return next(
                new ApiError("UnauthorizedError", decoded.message, 401)
            );
        }

        socket.user = { auth: decoded.data };

        return next();
    } catch (err) {
        return next(new ApiError(err.name, err.message, 401));
    }
};
