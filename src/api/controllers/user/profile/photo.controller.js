import sendResponse from "../../../../helpers/sendResponse.js";
import crypto from "crypto";

import { validatePhtoInfo } from "../../../../helpers/uploadFile.helper.js";
import {
    getS3SingedUrl,
    getS3KeyInfo,
    deleteS3Key
} from "../../../../helpers/s3.helper.js";

import { buildSubscriptionInfo } from "../../../../helpers/subscription/subscription.helper.js";

import { updateProfile } from "../../../../services/profile.service.js";
import {
    getSession,
    setSession
} from "../../../../services/session.service.js";

export const getPhotos = async (req, res) => {
    const { currentProfile } = req.auth;

    return sendResponse(res, 200, {
        message: "Photos fetched successfully",
        data: {
            total: currentProfile.photos.length,
            photos: [
                ...currentProfile.photos.map(p => ({
                    id: p._id,
                    url: p.url,
                    isPrimary: false,
                    createdAt: p.createdAt
                })),
                {
                    id: "none",
                    url: currentProfile.primaryPhoto.url,
                    isPrimary: true,
                    createdAt: currentProfile.primaryPhoto.createdAt
                }
            ]
        }
    });
};

export const uploadPhoto = async (req, res) => {
    const { currentProfile } = req.auth;

    const premium = buildSubscriptionInfo(currentProfile.premium);
    const photoLimit = !premium.isActive ? 4 : 8;
    
    if (currentProfile.photos?.length >= photoLimit) {
        const next = !premium.isActive ? "upgrade_plan" : "manage_photos";

        return sendResponse(res, 409, {
            success: false,
            code: "PHOTO_LIMIT_REACHED",
            message: `Photo limit reached. You can upload up to ${photoLimit} photos on your current plan.`,
            next,
            route: next === "upgrade_plan" ? "/premium" : "/profile/photos",
            meta: {
                currentPlan: premium.isActive ? premium.tier : "free",
                maxPhotosAllowed: photoLimit,
                currentPhotos: currentProfile.photos?.length || 0
            }
        });
    }
    const redisKey = `pending_upload:${currentProfile.id}:${req.body?.key}`;

    const findUpload = await getSession(redisKey);

    if (findUpload) {
        try {
            const uploadInfo = await getS3KeyInfo(req.body?.key);

            currentProfile.photos.push({
                url: findUpload.fileUrl,
                key: req.body?.key
            });

            const photosInfo = await updateProfile(
                {
                    _id: currentProfile._id
                },
                {
                    photos: currentProfile.photos
                }
            ).photos;

            const photoId =
                currentProfile.photos[currentProfile.photos.length - 1]?._id;

            return sendResponse(res, 200, {
                message: "Photo uploaded successfully",
                data: {
                    photo: {
                        id: photoId,
                        url: findUpload.fileUrl,
                        contentType: uploadInfo.ContentType,
                        size: uploadInfo.ContentLength
                    },
                    photosCount: currentProfile.photos.length,
                    maxPhotosAllowed: photoLimit,
                    meta: {
                        limitReached: photoLimit >= currentProfile.photos.length
                    }
                }
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
    }

    const isValidPhoto = validatePhtoInfo({
        fileName: req.body?.fileName,
        fileType: req.body?.fileType
    });

    if (!isValidPhoto?.success) {
        return sendResponse(res, 400, isValidPhoto);
    }

    const randomId = crypto.randomBytes(8).toString("hex");

    const key = `users/${currentProfile.userId}/${randomId}-${req.body?.fileName}`;

    const { uploadUrl, fileUrl } = await getS3SingedUrl({
        key,
        fileType: req.body?.fileType
    });

    await setSession(
        {
            fileUrl,
            createdAt: new Date()
        },
        key,
        `pending_upload:${currentProfile.id}`,
        "EX",
        800
    );

    return sendResponse(res, 200, {
        success: true,
        code: "PHOTO_UPLOAD_PRESIGNED",
        message: "Upload URL generated successfully",
        data: {
            uploadUrl,
            key,
            fileUrl
        }
    });
};

export const replacePrimaryPhoto = async (req, res) => {
    const { currentProfile } = req.auth;

    const redisKey = `pending_upload:${currentProfile.id}:${req.body?.key}`;

    const findUpload = await getSession(redisKey);

    if (!findUpload) {
        const isValidPhoto = validatePhtoInfo({
            fileName: req.body?.fileName,
            fileType: req.body?.fileType
        });

        if (!isValidPhoto?.success) {
            return sendResponse(res, 400, isValidPhoto);
        }

        const randomId = crypto.randomBytes(8).toString("hex");

        const key = `users/${currentProfile.userId}/${randomId}-${req.body?.fileName}`;

        const { uploadUrl, fileUrl } = await getS3SingedUrl({
            key,
            fileType: req.body?.fileType
        });

        await setSession(
            {
                fileUrl,
                createdAt: new Date()
            },
            key,
            `pending_upload:${currentProfile.id}`,
            "EX",
            800
        );

        return sendResponse(res, 200, {
            success: true,
            code: "PHOTO_UPLOAD_PRESIGNED",
            message: "Upload URL generated successfully",
            data: {
                uploadUrl,
                key,
                fileUrl
            }
        });
    }

    try {
        const uploadInfo = await getS3KeyInfo(req.body?.key);

        if (!currentProfile.primaryPhoto?.key) {
            const updatedPhoto = await updateProfile(
                {
                    _id: currentProfile._id
                },
                {
                    primaryPhoto: {
                        url: findUpload.fileUrl,
                        key: req.body?.key
                    }
                }
            );

            return sendResponse(res, 200, {
                code: "PHOTO_PRIMARY_UPDATED",
                message: "Primary photo updated successfully",
                data: {
                    photo: {
                        id: "none",
                        url: updatedPhoto.primaryPhoto.url,
                        isPrimary: true,
                        createdAt: updatedPhoto.primaryPhoto.createdAt
                    }
                }
            });
        }

        await deleteS3Key(currentProfile.primaryPhoto.key);

        const updatedPhoto = await updateProfile(
            {
                _id: currentProfile._id
            },
            {
                "primaryPhoto.url": findUpload.fileUrl,
                "primaryPhoto.key": req.body?.key
            }
        );

        return sendResponse(res, 200, {
            code: "PHOTO_PRIMARY_UPDATED",
            message: "Primary photo updated successfully",
            data: {
                photo: {
                    id: "none",
                    url: updatedPhoto.primaryPhoto.url,
                    isPrimary: true,
                    createdAt: updatedPhoto.primaryPhoto.createdAt
                }
            }
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
            	type: error.name,
                message: error.message,
                code: "PHOTO_DELETE_FAILED"
            });
        }
    }
};

export const deletePhoto = async (req, res) => {
    try {
        const { currentProfile } = req.auth;
        const premium = buildSubscriptionInfo(currentProfile.premium);
        const photoLimit = !premium.isActive ? 4 : 8;

        if (req.params?.photoId?.length !== 24) {
            return sendResponse(res, 400, {
                message: "Invalid id format",
                code: "INVALID_OBJECT_ID",
                hint: "Id must be a 24-character MongoDB ObjectId"
            });
        }

        const photoIndex = currentProfile.photos.findIndex(
            k => String(k._id) !== String(req.params.photoId)
        );

        if (photoIndex === -1) {
            return sendResponse(res, 404, {
                message: "Photo not found",
                code: "PHOTO_NOT_FOUND",
                hint: "This photo does not exist in your profile"
            });
        }

        const photoInfo = currentProfile.photos[photoIndex];
        currentProfile.photos.splice(photoIndex, 1);

        await deleteS3Key(photoInfo.key);
        await updateProfile(
            {
                _id: currentProfile._id
            },
            {
                photos: currentProfile.photos
            }
        ).photos;

        return sendResponse(res, 200, {
            message: "Photo deleted successfully",
            data: {
                photoId: photoInfo._id,
                deleted: true
            },
            meta: {
                remainingPhotos: currentProfile.photos,
                maxAllowed: photoLimit,
                tier: premium.isActive ? premium.tier : "free"
            }
        });
    } catch (err) {
        return sendResponse(res, 500, {
            message: "Failed to delete photo",
            code: "PHOTO_DELETE_FAILED",
            hint: "Something went wrong while deleting from storage"
        });
    }
};
