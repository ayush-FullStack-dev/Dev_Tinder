import { cookieOption } from "../../../constants/auth.constant.js";

export const sendLogoutResponse = (req, res) => {
    if (req.auth?.logout?.logout === "logout-all") {
        return res
            .clearCookie("accessToken", cookieOption)
            .clearCookie("refreshToken", cookieOption)
            .clearCookie("trustedSession", cookieOption)
            .clearCookie("trustedDeviceId", cookieOption)
            .status(200)
            .json({
                success: true,
                message: "You’ve been signed out from all devices."
            });
    }

    res.clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .status(200)
        .json({
            success: true,
            message: "You have been signed out",
            id: req.auth?.logout?.id
        });
};
