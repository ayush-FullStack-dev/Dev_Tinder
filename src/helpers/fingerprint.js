import { generateHash, verifyHash } from "./hash.js";

export const fingerprintBuilder = userInfo => {
    const data = Object.values(userInfo);
    const fingerprint = [data].join("|");
    return generateHash(fingerprint);
};

export const compareFingerprint =  (org, hash) => {
    if (typeof org !== "string") {
        let data = Object.values(org);
        org = [data].join("|");
    }

    return  verifyHash(org, hash);
};
