import { generateHash, verifyHash } from "../helpers/hash.js";

export const fingerprintBuilder = userInfo => {
    const fingerprint = `${userInfo.browser}|${userInfo.os}|${userInfo.osVersion}|${userInfo.deviceModel}|${userInfo.deviceType}|${userInfo.deviceId}|${userInfo.userAgent}|${userInfo.deviceSize}|${userInfo.timezone}`;
    return generateHash(fingerprint);
};

export const compareFingerprint = (org, hash) => {
    if (typeof org !== "string") {
        org = `${org.browser}|${org.os}|${org.osVersion}|${org.deviceModel}|${org.deviceType}|${org.deviceId}|${org.userAgent}|${org.deviceSize}|${org.timezone}`;
    }
    return verifyHash(org, hash);
};
