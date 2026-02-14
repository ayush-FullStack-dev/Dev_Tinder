import sendResponse from "../../../../helpers/sendResponse.js";

import { handleToneUpload } from "../../../../helpers/ringtone/toneUpload.helper.js";
import { getAudioDuration } from "../../../../helpers/file/audio.helper.js";
import {
    deleteTemp,
    downloadToTemp
} from "../../../../helpers/file/tempFile.helper.js";
import { getS3KeyInfo, deleteS3Key } from "../../../../helpers/s3.helper.js";

import { updateProfile } from "../../../../services/profile.service.js";
import { buildSubscriptionInfo } from "../../../../helpers/premium.helper.js";
import {
    getSession,
    setSession
} from "../../../../services/session.service.js";
import { ringtone } from "../../../../constants/call.constant.js";

// Incoming tone
export const getIncomingTone = async (req, res) => {
    const { currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);

    return sendResponse(res, 200, {
        success: true,
        data: {
            enabled:
                currentProfile.premium.features.ringtone?.incoming?.enabled,
            url: currentProfile.premium.features.ringtone?.incoming?.url,
            source: currentProfile.premium.features.ringtone?.incoming?.enabled
                ? "custom"
                : "default",
            isPremium: premium.isActive
        }
    });
};

export const updateIncomingTone = async (req, res) => {
    try {
        const { currentProfile } = req.auth;

        const redisKey = `pending_upload:${currentProfile._id}:${req.body?.key}`;

        const uploadInfo = await getSession(redisKey);

        if (!uploadInfo) {
            const presingedInfo = await handleToneUpload(
                currentProfile,
                req.body
            );

            await setSession(
                {
                    fileUrl: presingedInfo.data.file.url,
                    createdAt: new Date()
                },
                presingedInfo.data.file.key,
                `pending_upload:${currentProfile._id}`,
                "EX",
                2500
            );

            return sendResponse(res, 200, presingedInfo);
        }

        await getS3KeyInfo(req.body?.key);

        const localFile = await downloadToTemp(req.body.key);

        const duration = await getAudioDuration(localFile);

        await deleteTemp(localFile);

        if (duration < 5 || duration > 15) {
            await deleteS3Key(req.body.key);
            return sendResponse(
                res,
                400,
                "Audio duration must be greater than 4 and less than 16 seconds"
            );
        }

        await updateProfile(
            {
                _id: currentProfile._id
            },
            {
                "premium.features.ringtone.incoming": {
                    enabled: true,
                    key: req.body.key,
                    url: uploadInfo.fileUrl
                }
            }
        );

        return sendResponse(res, 200, {
            message: "Incoming ringtone updated"
        });
    } catch (error) {
        if (error?.name === "NotFound") {
            return sendResponse(res, 409, {
                message: "Upload not found on S3",
                code: "UPLOAD_NOT_FOUND",
                hint: "Upload the file first using uploadUrl, then confirm again"
            });
        } else {
            return sendResponse(res, 500, {
                type: error?.name,
                message: error.message
            });
        }
    }
};

export const resetIncomingTone = async (req, res) => {
    const { currentProfile } = req.auth;
    const premium = buildSubscriptionInfo(currentProfile.premium);

    if (
        premium.isActive ||
        !currentProfile.premium.features.ringtone?.incoming?.enabled
    ) {
        return sendResponse(res, 400, {
            code: "RINGTONE_ALREADY_DEFAULT",
            message: "Incoming ringtone is already set to default",
            action: "NO_OP"
        });
    }

    await deleteS3Key(currentProfile.premium.features.ringtone.incoming?.key);

    await updateProfile(
        {
            _id: currentProfile._id
        },
        {
            "premium.features.ringtone.incoming": {
                enabled: false,
                url: ringtone.incoming
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Incoming ringtone reset to default"
    });
};

// ringback tone
export const getRingBackTone = async (req, res) => {
    const { currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);

    return sendResponse(res, 200, {
        success: true,
        data: {
            enabled:
                currentProfile.premium.features.ringtone?.ringback?.enabled,
            url: currentProfile.premium.features.ringtone?.ringback?.url,
            source: currentProfile.premium.features.ringtone?.ringback?.enabled
                ? "custom"
                : "default",
            isPremium: premium.isActive
        }
    });
};

export const updateRingBackTone = async (req, res) => {
    try {
        const { currentProfile } = req.auth;
        const redisKey = `pending_upload:${currentProfile.id}:${req.body?.key}`;

        const uploadInfo = await getSession(redisKey);

        if (!uploadInfo) {
            const presingedInfo = await handleToneUpload(
                currentProfile,
                req.body
            );

            await setSession(
                {
                    fileUrl: presingedInfo.data.file.url,
                    createdAt: new Date()
                },
                presingedInfo.data.file.key,
                `pending_upload:${currentProfile._id}`,
                "EX",
                2500
            );

            return sendResponse(res, 200, presingedInfo);
        }

        await getS3KeyInfo(req.body.key);

        const localFile = await downloadToTemp(req.body.key);

        const duration = await getAudioDuration(localFile);

        await deleteTemp(localFile);
        if (duration < 6 || duration > 15) {
            await deleteS3Key(req.body.key);
            return sendResponse(
                res,
                400,
                "Audio duration must be greater than 5 and less than 16 seconds"
            );
        }

        await updateProfile(
            {
                _id: currentProfile._id
            },
            {
                "premium.features.ringtone.ringback": {
                    enabled: true,
                    key: req.body.key,
                    url: uploadInfo.fileUrl
                }
            }
        );

        return sendResponse(res, 200, {
            message: "Ringback tone updated"
        });
    } catch (error) {
        if (error?.name === "NotFound") {
            return sendResponse(res, 409, {
                message: "Upload not found on S3",
                code: "UPLOAD_NOT_FOUND",
                hint: "Upload the file first using uploadUrl, then confirm again"
            });
        } else {
            return sendResponse(res, 500, {
                type: error?.name,
                message: error.message
            });
        }
    }
};

export const resetRingBackTone = async (req, res) => {
    const { currentProfile } = req.auth;
    const premium = buildSubscriptionInfo(currentProfile.premium);

    if (
        premium.isActive ||
        !currentProfile.premium.features.ringtone?.ringback?.enabled
    ) {
        return sendResponse(res, 400, {
            code: "RINGTONE_ALREADY_DEFAULT",
            message: "Ringback tone is already set to default",
            action: "NO_OP"
        });
    }

    await deleteS3Key(currentProfile.premium.features.ringtone.ringback?.key);

    await updateProfile(
        {
            _id: currentProfile._id
        },
        {
            "premium.features.ringtone.ringback": {
                enabled: false,
                url: ringtone.ringback
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Ringback tone reset to default"
    });
};
