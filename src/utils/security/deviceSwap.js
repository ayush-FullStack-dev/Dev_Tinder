import redis from "../config/redis.js";

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

export default checkDeviceSwap;
