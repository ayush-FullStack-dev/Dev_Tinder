import redis from "../config/redis.js";

export const checkDeviceSwap = async (currentInfo, link, ...skips) => {
    let savedInfo = await redis.get(link);
    savedInfo = JSON.parse(savedInfo);
    for (const data in savedInfo) {
        if (skips.includes(data)) {
            continue;
        }
        if (savedInfo[data] !== currentInfo[data]) {
            return "This request is blocked for securty reason";
        }
    }

    return null;
};

export const checkTimeManipulation = async time => {
    const diff = Math.abs(time.serverTime - time.clientTime);
    if (diff > 2 * 60 * 1000) {
        return "Time Manipulation Attack detcted";
    }
    return null;
};

export const tokenBuilder = userInfo => {
    return {
        browser: userInfo.browser,
        os: userInfo.os,
        deviceId: userInfo.deviceId,
        ip: userInfo.ip,
        token: userInfo.token,
        version: 1,
        fingerprint: userInfo.fingerprint,
        country: userInfo.country,
        createdAt: Date.now()
    };
};

export const cleanup2fa = async user => {
    await redis.del(`device:info:${user._id}`);
    await redis.del(`2fa:session:${user._id}`);
    await redis.del(`2fa:fp:start:${user._id}`);
    return true;
};
