import ApiError from "./ApiError.js";

import {
    HeadObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3.js";

export const isValidS3UserPhotoKey = (key = "") => {
    if (typeof key !== "string") return false;

    const regex = /^users\/[a-f0-9]{24}\/[a-f0-9]{16,32}-[a-zA-Z0-9._-]{2,80}$/;

    return regex.test(key);
};

export const getS3KeyInfo = key => {
    const command = new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    return s3.send(command);
};

export const deleteS3Key = async key => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    await s3.send(command);

    return true;
};

export const getS3SingedUrl = async config => {
    if (!config) {
        throw new ApiError(
            "InternalServerError",
            "no config provide to sing s3 bucket url",
            500
        );
    }
    
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: config.key,
        ContentType: config.fileType
    });

    const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: config.expiresIn || 60
    });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${config.key}`;

    return {
        success: true,
        uploadUrl,
        fileUrl
    };
};
