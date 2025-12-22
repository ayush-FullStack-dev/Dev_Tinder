import { parseUA } from "./parseUA.js";
import { getTime } from "./helpers.js";

export const buildDeviceInfo = (ua, validateValues, info) => {
    const time = getTime(validateValues?.clientTime);
    return {
        ...parseUA(ua),
        deviceId: validateValues.deviceId || "test",
        userAgent: ua,
        ip: info.ip,
        city: info.city || "test",
        location: info.location,
        country: info.country,
        deviceSize: validateValues.deviceSize,
        timezone: info.timezone || "test",
        time: time.clientTime,
        fullTime: time.fullTime
    };
};
