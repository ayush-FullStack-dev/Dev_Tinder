import { cookieOption } from "../constants/auth.constant.js";

function sendResponse(response, code, option, success) {
    const isSuccess = String(code).startsWith("2");
    if (typeof option === "string") {
        return response.status(code).json({
            success: success || isSuccess,
            message: option
        });
    }
    return response.status(code).json({
        success: success || isSuccess,
        ...option
    });
}



export function removeCookie(response, code, message, success) {
    const isSuccess = String(code).startsWith("2");
    if (typeof message === "string") {
        return response
            .status(code)
            .clearCookie("accessToken", cookieOption)
            .clearCookie("refreshToken", cookieOption)
            .json({
                success: success || isSuccess,
                message
            });
    }
    response
        .status(code)
        .clearCookie("accessToken", cookieOption)
        .clearCookie("refreshToken", cookieOption)
        .json({
            success: success || isSuccess,
            ...message
        });
}

export default sendResponse;
