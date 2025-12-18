import geoip from "geoip-lite";
import epochify from "epochify";

import { prettyErrorResponse } from "./ApiError.js";

import { joiOptions } from "../constants/validator.constant.js";

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

export const getIpInfo = (ip = "103.21.33.0") => {
    if (ip.includes("::ffff:") || ip === "127.0.0.1") {
        ip = "103.21.33.0";
    }
    const geo = geoip.lookup(ip);
    return {
        country: geo?.country,
        timezone: geo?.timezone,
        region: geo?.region,
        city: geo?.city,
        ip: ip,
        location: `${geo?.city},${geo?.country}`
    };
};

export const getTime = req => {
    const time = epochify.getFullDateTime();
    const clientTime = new Date(req.body.clientTime || Date.now()).getTime();
    return {
        serverTime: time.timestamp,
        clientTime,
        fullTime: time
    };
};

export const collectOnMethod = loginMethods => {
    const methods = [];

    for (const method in loginMethods) {
        if (loginMethods[method].on || loginMethods[method]?.code?.length) {
            methods.push(loginMethods[method].type);
        }
    }

    return methods;
};
