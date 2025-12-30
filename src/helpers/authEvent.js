import { getNoSaltHash } from "./hash.js";

export const buildAuthInfo = async (deviceInfo, verify, others) => {
    
    
    return {
        deviceId: getNoSaltHash(deviceInfo.deviceId),
        ip: deviceInfo.ip,
        ipCountry: deviceInfo.country,
        ipCity: deviceInfo.city,
        userAgent: deviceInfo.userAgent,
        userId: others._id,
        eventType: others.eventType,
        action: others.action || "login",
        mfaUsed: others.mfaUsed,
        success: others.success,
        risk: others.risk,
        loginMethod: others?.loginMethod || verify?.method,
        reason: verify?.message,
        trusted: others.trusted,
        createdAt: new Date()
    };
};
