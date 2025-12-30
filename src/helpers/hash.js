import bcrypt from "bcryptjs";
import ApiError from "./ApiError.js";
import crypto from "crypto"

export const generateHash = async org => {
    if (!org) {
        throw new ApiError("BadRequest", "data is required to hash it", 400);
    }
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(org, salt);
};

export const verifyHash = async (org, hash) => {
    if (!org || !hash) {
        throw new ApiError(
            "BadRequest",
            "original data && hash data is required to compare it",
            400
        );
    }
    return bcrypt.compare(org, hash);
};

export const getNoSaltHash = org => {
    if (!org) {
        throw new ApiError("BadRequest", "data is required to hash it", 400);
    }
    return crypto.createHash("sha256").update(org).digest("hex");
};

export const compareNoSaltHash = (org, hash) => {
    if (!org || !hash) {
        throw new ApiError(
            "BadRequest",
            "original data && hash data is required to compare it",
            400
        );
    }

    const orgHash = crypto.createHash("sha256").update(org).digest("hex");
    if (orgHash !== hash) {
        return false;
    }
    return true;
};
