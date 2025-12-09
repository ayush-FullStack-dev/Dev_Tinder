import { generateHash } from "../../helpers/hash.js";
import redis from "../../config/redis.js";

export const getOtpSetOtp = async user => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const saveOtp = await generateHash(otp.toString());
    await redis.set(`otp:${user._id}`, saveOtp, "EX", 600);
    return otp;
};

export const setSession = async (data, user, link = "2fa:session") => {
    const jsonData = JSON.stringify(data);
    await redis.set(`${link}:${user._id}`, jsonData);
    return true;
};
