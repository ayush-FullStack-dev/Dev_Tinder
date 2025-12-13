import { parseUA } from "./parseUA.js";

export const buildDeviceInfo = (ua, validateValues, info) => {
    if (info) {
        return {
            ...parseUA(ua),
            deviceId: validateValues.deviceId || "test",
            userAgent: ua,
            city: info.city || "test",
            location: info.location,
            country: info.country,
            deviceSize: validateValues.deviceSize,
            timezone: info.timezone || "test",
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
