import redis from "../config/redis.js";
import { compareFingerprint } from "../helpers/fingerprint.js";
import epochify from "epochify";

export const checkDeviceSwap = async (currentInfo, link, skips) => {
    let savedInfo = await redis.get(link);
    savedInfo = JSON.parse(savedInfo);
    for (const data in savedInfo) {
        if (skips.includes(data)) {
            continue;
        }
        if (savedInfo[data] !== currentInfo[data]) {
            return {
                success: false,
                message: "This request is blocked for securty reason"
            };
        }
    }

    return {
        success: true,
        info: savedInfo
    };
};

export const checkTimeManipulation = time => {
    const diff = Math.abs(time.serverTime - time.clientTime);
    if (diff > 2 * 60 * 1000) {
        return { success: false, message: "Time Manipulation Attack detcted" };
    }
    return { success: true };
};

export const tokenBuilder = userInfo => {
    return {
        ip: userInfo.ip,
        country: userInfo.country,
        city: userInfo.city,
        deviceId: userInfo.deviceId,
        browser: userInfo.browser,
        os: userInfo.os,
        deviceType: userInfo.deviceType,
        deviceSize: userInfo.deviceSize,
        deviceModel: userInfo.deviceModel,
        timezone: userInfo.timezone,
        token: userInfo.token,
        version: 1,
        fingerprint: userInfo.fingerprint,
        createdAt: Date.now()
    };
};

export const cleanup2fa = async user => {
    await redis.del(`device:info:${user._id}`);
    await redis.del(`2fa:session:${user._id}`);
    await redis.del(`2fa:session:${user.email}`);
    await redis.del(`2fa:fp:start:${user._id}`);
    return true;
};

export const getRiskLevel = score => {
    if (score < 30) return "verylow";
    if (score < 55) return "low";
    if (score < 75) return "mid";
    if (score < 100) return "high";
    return "veryhigh";
};

export const getRiskScore = async (current, last, others) => {
    let score = 0;
    const hour = new Date().getHours();
    const timeManip = checkTimeManipulation(others.time);
    const fpValid = await compareFingerprint(
        current,
        last.fingerprint ||
            "$2b$10$EDstMQkU6TFzC9cRATw32OtFI15cveoGhDM0fgYlg9N.9zP2P9AAq"
    );
    const diffMin = epochify.getDiff(Date.now(), last.createdAt, "minute");
    const diffDay = epochify.getDiff(Date.now(), last.createdAt, "days");

    // GEO
    if (current.ip !== last.ip) score += 5;
    if (current.country !== last.country) score += 30;
    if (current.country === last.country && current.city !== last.city)
        score += 10;
    if (current.timezone !== last.timezone) score += 15;

    // DEVICE
    if (current.deviceId !== last.deviceId) score += 25;
    if (current.browser !== last.browser) score += 5;
    if (current.os !== last.os) score += 15;
    if (current.deviceType !== last.deviceType) score += 20;
    if (current.deviceSize !== last.deviceSize) score += 10;
    if (current.deviceModel !== last.deviceModel) score += 25;
    if (!fpValid) score += 40;

    // TIME
    if (diffMin < 15) score += 25;
    if (hour <= 5) score += 5;
    if (!timeManip?.success) score += 40;

    // BEHAVIOR
    if (diffDay >= 25) score += 15;

    return score;
};
