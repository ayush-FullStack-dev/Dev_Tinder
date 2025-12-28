import twoFAValidators from "../../validators/auth/twoFA.validator.js";

import sendResponse from "../../helpers/sendResponse.js";

import { buildDeviceInfo } from "../../helpers/buildDeviceInfo.js";
import { setRefreshExpiry, checkValidation } from "../../helpers/helpers.js";
import { getIpInfo } from "../../helpers/ip.js";

export const twoFAValidation = (req, res, next) => {
    req.auth = {};
    const validate = checkValidation(
        twoFAValidators,
        req,
        "vaildation failed for twoFactorAuthentication"
    );

    if (!validate?.success) {
        return sendResponse(res, 400, validate.jsonResponse);
    }

    req.auth.email = validate.value.email;
    req.auth.ip = req.realIp;
    req.auth.country = getIpInfo(req.realIp);
    req.auth.loginMethod = req.body.method?.toUpperCase() || null;
    req.auth.refreshExpiry = setRefreshExpiry(validate.value);
    req.auth.deviceInfo = buildDeviceInfo(
        req.headers["user-agent"],
        validate.value,
        getIpInfo(req.realIp)
    );
    next();
};
