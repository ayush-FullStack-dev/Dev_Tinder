import { parseUA } from "./parseUA.js";
import { getTime } from "./helpers.js";

export const buildDeviceInfo = (ua, validateValues, info) => {
    const time = getTime(validateValues?.clientTime);
    return {
        ...parseUA(ua),
        deviceId: validateValues?.deviceId || "UNKNOWN",
        userAgent: ua,
        ip: info?.ip || "UNKNOWN",
        city: info?.city || "test",
        location: info?.location || "UNKNOWN",
        country: info?.country || "UNKNOWN",
        deviceSize: validateValues?.deviceSize || "UNKNOWN",
        timezone: info?.timezone || "UNKNOWN",
        time: time.clientTime || "UNKNOWN",
        fullTime: time.fullTime || "UNKNOWN"
    };
};
