import ApiError from "../ApiError.js";
import crypto from "crypto";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { s3 } from "../../config/s3.js";

const allowedMimeTypes = [
    "audio/mpeg", // MP3 - best
    "audio/mp4", // M4A - iOS friendly
    "audio/aac", // optional
    "audio/ogg" // optional (Android)
];

const extMap = {
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/aac": "aac",
    "audio/ogg": "ogg"
};

export const handleToneUpload = async (currentProfile, body) => {
    const { mimeType } = body;

    if (!mimeType) {
        throw new ApiError("BadRequest", "mimeType required", 400);
    }

    if (!allowedMimeTypes.includes(mimeType)) {
        throw new ApiError(
            "BadRequest",
            `Invalid audio type allowd types ${allowedMimeTypes.join(" , ")}`,
            400
        );
    }

    const ext = extMap[mimeType] || "mp3";

    const key = `users/${currentProfile._id}/${crypto
        .randomBytes(16)
        .toString("hex")}.${ext}`;

    const { url, fields } = await createPresignedPost(s3, {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Conditions: [
            ["content-length-range", 1, 5242880],
            ["starts-with", "$Content-Type", "audio/"]
        ],
        Fields: {
            "Content-Type": mimeType,
            "Cache-Control": "public, max-age=31536000",
            "Content-Disposition": "inline"
        },
        Expires: 60 * 5
    });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
        success: true,
        message: "Upload URL generated",
        data: {
            upload: {
                url,
                method: "POST",
                expiresIn: 60 * 5
            },
            file: {
                key,
                url: fileUrl,
                maxSizeMB: 5,
                allowedType: "audio/*"
            },
            formFields: {
                ...fields
            }
        }
    };
};
