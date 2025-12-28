import sendResponse from "../../helpers/sendResponse.js";

import { findUser } from "../../services/user.service.js";
import { verifyAccesToken } from "../../helpers/token.js";

export const isLogin = (req, res, next) => {
    const accessToken = req.signedCookies?.accessToken;
    const refreshToken = req.signedCookies?.refreshToken;
    const data = verifyAccesToken(accessToken);

    if (!accessToken) {
        return sendResponse(res, 401, {
            message: "Login required to access this resource."
        });
    }

    if (!data?.success) {
        return sendResponse(res, 401, {
            message: data.message
        });
    }

    req.auth = {
        ...req.auth,
        info: data?.data,
        refreshToken
    };

    return next();
};

export const findLoginData = async (req, res, next) => {
    const { info, refreshToken } = req.auth;

    const user = await findUser({
        _id: info._id
    });

    if (!user) {
        return sendResponse(res, 401, {
            message: "AccessToken is inavlid please login again."
        });
    }

    const findedToken = user.refreshToken.find(k => k.token === refreshToken);

    req.auth.findedCurrent = findedToken;
    req.auth.user = user;
    next();
};

export const validateBasicInfo = (req, res, next) => {
    if (req?.body) {
        const { clientTime = Date.now(), deviceId, deviceSize } = req.body;

        if (!clientTime) {
            return sendResponse(res, 400, "provide current client timestamp");
        }

        if (!deviceId || deviceId?.length !== 32) {
            return sendResponse(res, 400, "provide valid  deviceId");
        }

        if (!deviceSize) {
            return sendResponse(
                res,
                400,
                "provide device size mix of width + height"
            );
        }

        if (deviceSize >= 170 && deviceSize <= 3000) {
            return sendResponse(res, 400, "provide valid device size");
        }

        req.body.clientTime = clientTime;
        return next();
    }

    const { clienttime = Date.now(), deviceid, devicesize } = req.headers;

    if (!clienttime) {
        return sendResponse(res, 400, "provide current client timestamp");
    }

    if (!deviceid || deviceid?.length !== 32) {
        return sendResponse(res, 400, "provide valid  deviceId");
    }

    if (!devicesize) {
        return sendResponse(
            res,
            400,
            "provide device size mix of width + height"
        );
    }

    if (devicesize >= 170 && devicesize <= 3000) {
        return sendResponse(res, 400, "provide valid device size");
    }
    
    req.body = {
        ...req.body,
        clientTime: clienttime,
        deviceId: deviceid,
        deviceSize: devicesize
    };

    return next();
};
