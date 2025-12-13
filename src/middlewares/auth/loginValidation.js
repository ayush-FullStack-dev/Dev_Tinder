import loginValidators from "../../validators/auth/login.validator.js";

import sendResponse from "../../helpers/sendResponse.js";

import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import {
    getIpInfo,
    getTime,
    checkValidation,
    setRefreshExpiry
} from "../../helpers/helpers.js";

export const loginValidation = (req, res, next) => {
    req.auth = {};
    const { email, username } = req.body;

    const validate = checkValidation(
        loginValidators,
        req,
        "vaildation failed for login"
    );

    if (!validate?.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    if (email) {
        req.auth.login = email;
        req.auth.fieldName = "email";
    } else {
        req.auth.login = username;
        req.auth.fieldName = "username";
    }

    req.auth.deviceInfo = {
        ...buildDeviceInfo(
            req.headers["user-agent"],
            validate.value,
            getIpInfo( req.realIp)
        ),
        ip:  req.realIp
    };
    req.auth.password = validate.value.password;
    req.auth.time = getTime(req);
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    next();
};
