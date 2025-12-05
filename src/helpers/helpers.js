import { signToken } from "./jwt.js";

export function sendResponse(response, code, option, success) {
    const isSuccess = String(code).startsWith("2");
    return response.status(code).json({
        success: success || isSuccess,
        ...option
    });
}

export function getAccesToken(data) {
    return signToken(data, "30m");
}

export function getRefreshToken(data, expiry) {
    return signToken(data, expiry);
}
