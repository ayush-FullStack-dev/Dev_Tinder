import { signToken } from "./jwt.js";
import { UAParser } from "ua-parser-js";
import { prettyErrorResponse } from "./ApiError.js";
import epochify from "epochify";

const joiOptions = {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false
};

export function sendResponse(response, code, option, success) {
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

export function getAccesToken(user) {
    return signToken(
        {
            _id: user._id,
            name: user.name,
            email: user.email,
            picture: user.picture,
            role: user.role,
            age: user.age,
            gender: user.gender
        },
        "30m"
    );
}

export function getRefreshToken(data, expiry) {
    return signToken(data, expiry);
}

export function checkSuspicious(req, lastSession, country, ip) {
    const lastLoginDay = epochify.getDiff(
        Date.now(),
        lastSession.createdAt,
        "days"
    );
    const checkTime = epochify.getDiff(
        Date.now(),
        lastSession.createdAt,
        "minute"
    );
    if (lastLoginDay >= 25) {
        return true;
    }
    if (lastLoginDay <= 3) {
        if (req.body.deviceId !== lastSession.deviceId) {
        } else if (ip !== lastSession.ip) {
        } else if (req.body.os === lastSession.os) {
        } else if (country !== lastSession.country && checkTime > 15) {
        } else {
            return true;
        }
    }
    return false;
}

export const parseUA = userAgent => {
    if (!userAgent.includes("KHTML")) {
        userAgent = `Mozilla/5.0 (Linux; Android 13; SM-M326B) AppleWebKit/537.36 
(KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36`;
    }
    const parser = new UAParser(userAgent);
    let deviceType = null;
    const result = parser.getResult();
    if (userAgent.includes("Mobile")) {
        deviceType = "mobile";
    } else if (
        ua.includes("tablet") ||
        ua.includes("ipad") ||
        ua.includes("sm-t") ||
        ua.includes("xoom") ||
        ua.includes("silk") ||
        ua.includes("kindle")
    ) {
        deviceType = "tab";
    } else {
        deviceType = "deskopt";
    }
    return {
        browser: result.browser.name,
        browserVersion: result.browser.version,
        os: result.os.name,
        deviceType,
        osVersion: result.os.version,
        deviceModel: result.device.model
    };
};

export const buildDeviceInfo = (ua, validateValues, info) => {
    if (info) {
        return {
            ...parseUA(ua),
            deviceId: validateValues.deviceId || "test",
            userAgent: ua,
            location: info.location,
            country: info.country,
            deviceSize: validateValues.deviceSize,
            timezone: info.timezone,
            time: Date.now()
        };
    }
    return {
        ...parseUA(ua),
        deviceId: validateValues.deviceId || "test",
        userAgent: ua,
        deviceSize: validateValues.deviceSize,
        timezone: validateValues.timezone,
        time: Date.now()
    };
};

export const setRefreshExpiry = validateValues => {
    if (validateValues.remember) {
        return "30d";
    }
    return "1d";
};

export const checkValidation = (validateSchema, req, msg) => {
    const validate = validateSchema.validate(req.body, joiOptions);
    if (validate.error) {
        const jsonResponse = prettyErrorResponse(validate, msg);
        return { success: false, jsonResponse };
    }
    return { success: true, value: validate.value };
};
