import { removeCookie } from "../../../helpers/sendResponse.js";

export const issueNewTokens = async (req, res, next) => {
    const { user, verify, riskLevel, tokenInfo, refreshToken, accessToken } =
        req.auth;

    tokenInfo.loginContext.trust = {
        deviceTrusted: true,
        sessionLevel: riskLevel
    };

    if (verify?.action === "logout-all") {
        // wait i implement logic to send email & logout when logout route complete
        return removeCookie(res, 401, verify?.message);
    } else if (verify?.action === "logout") {
        // wait i implement logic to send email & logout when logout route complete
        return removeCookie(res, 401, verify?.message);
    }

    await updateUser(
        {
            _id: user._id
        },
        {
            refreshToken: user.refreshToken
        }
    );

    res.status(200)
        .cookie("accessToken", accessToken, cookieOption)
        .cookie("refreshToken", refreshToken, cookieOption)
        .json({
            success: true,
            message: "Refresh token successfully"
        });
};
