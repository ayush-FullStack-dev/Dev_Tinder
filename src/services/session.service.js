import { generateHash } from "../helpers/hash.js"
import redis from "../config/redis.js";

export const getOtpSetOtp = async user => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const saveOtp = await generateHash(otp.toString());
    await redis.set(`otp:${user._id}`, saveOtp, "EX", 600);
    return otp;
};

export const setSession = async (data, user, link = "2fa:session") => {
    if (typeof data !== "string") {
        data = JSON.stringify(data);
    }
    if (typeof user === "string") {
        await redis.set(`${link}:${user}`, data);
        return true;
    }
    await redis.set(`${link}:${user._id}`, data);
    return true;
};

export const cleanup2fa = async user => {
    await redis.del(`device:info:${user._id}`);
    await redis.del(`2fa:session:${user._id}`);
    await redis.del(`2fa:data:${user.id}`);
    await redis.del(`2fa:fp:start:${user._id}`);
    return true;
};

export const getSession = async (link, option) => {
    let data = await redis.get(link);
    if (typeof option === "object" || option === undefined) {
        return JSON.parse(data);
    }
    return data;
};
