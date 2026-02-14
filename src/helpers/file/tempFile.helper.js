import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { s3 } from "../../config/s3.js";

export const downloadToTemp = async key => {
    const tempPath = path.join(
        process.cwd(),
        "/public/uploads/tmp/",
        `${Date.now()}-${key.split("/").pop()}`
    );

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    });

    const { Body } = await s3.send(command);

    await pipeline(Body, fs.createWriteStream(tempPath));

    return tempPath;
};

export const deleteTemp = async tempPath => {
    try {
        await fs.promises.unlink(tempPath);

        return true;
    } catch (error) {
        return false;
    }
};
