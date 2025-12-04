import bcrypt from "bcryptjs";
import ApiError from "./ApiError.js";

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
