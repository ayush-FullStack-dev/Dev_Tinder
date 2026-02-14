import sendResponse from "../../../../helpers/sendResponse.js";
import { buildSubscriptionInfo } from "../../../../helpers/premium.helper.js";
import { allowedMimeTypes } from "../../../../constants/file.constant.js";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../../../config/s3.js";
import crypto from "crypto";

export const uploadChatMedia = async (req, res) => {
    const { currentProfile, user } = req.auth;
    const { fileName, mimeType, size } = req.body;
    const premium = buildSubscriptionInfo(currentProfile.premium);

    if (!fileName || !mimeType) {
        return sendResponse(res, 400, "fileName and mimeType required");
    }

    if (!allowedMimeTypes.includes(mimeType)) {
        return sendResponse(
            res,
            400,
            `Invalid file type allowd types ${allowedMimeTypes.join(" , ")}`
        );
    }

    const MB = 1024 * 1024;
    const isAdmin = user.role === "admin";

    const MAX_SIZE = isAdmin
        ? 500 * MB
        : premium.isActive
        ? premium.tier === "gold"
            ? 100 * MB
            : 50 * MB
        : 15 * MB;

    const maxMB = MAX_SIZE / MB;

    if (size > MAX_SIZE) {
        return sendResponse(res, 413, `File too large ( "${maxMB}MB" max)`);
    }

    const ext = fileName.split(".").pop();
    const key = `users/${currentProfile._id}/chat/${crypto
        .randomBytes(16)
        .toString("hex")}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: mimeType
    });

    const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 60 * 5
    });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return sendResponse(res, 200, {
        message: "Upload URL generated",
        data: {
            uploadUrl,
            key,
            fileUrl,
            expiresIn: 60 * 5
        }
    });
};
