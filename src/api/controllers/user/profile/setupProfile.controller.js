import sendResponse from "../../../../helpers/sendResponse.js";
import crypto from "crypto";

import { validatePhtoInfo } from "../../../../helpers/uploadFile.helper.js";
import { getS3SingedUrl, getS3KeyInfo } from "../../../../helpers/s3.helper.js";

import {
    getSession,
    setSession
} from "../../../../services/session.service.js";

import {
    findProfile,
    createProfile
} from "../../../../services/profile.service.js";

import { profileSetupValidator } from "../../../../validators/user/profile.validator.js";
import { checkValidation } from "../../../../helpers/helpers.js";
import { getCoordinates, getIpDetails } from "../../../../helpers/ip.js";

export const profileSetupHandler = async (req, res) => {
    try {
        const { user } = req.auth;

        const isExists = await findProfile({
            userId: user._id
        });

        if (isExists) {
            return sendResponse(res, 409, "Profile already exists");
        }

        const isValidInfo = checkValidation(
            profileSetupValidator,
            req,
            "Invalid profile data"
        );

        if (!isValidInfo?.success) {
            return sendResponse(res, 400, isValidInfo.jsonResponse);
        }

        const redisKey = `pending_upload:${user.id}:${req.body?.key}`;

        const photoUpload = await getSession(redisKey);

        if (!photoUpload) {
            const isValidPhoto = validatePhtoInfo({
                fileName: req.body?.fileName,
                fileType: req.body?.fileType
            });

            if (!isValidPhoto?.success) {
                return sendResponse(res, 400, isValidPhoto);
            }

            const randomId = crypto.randomBytes(8).toString("hex");

            const key = `temp/${user._id}/${randomId}-${req.body?.fileName}`;

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
                `pending_upload:${user._id}`,
                "EX",
                120
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

        await getS3KeyInfo(req.body?.key);

        const { latitude, longitude } = await getCoordinates(req.realIp);
        const info = await getIpDetails(req.realIp);

        const data = await createProfile({
            userId: user._id,
            username: user.username,
            displayName: req.body.displayName,
            bio: req.body.bio,
            role: req.body.role,
            tech_stack: req.body.techStack,
            looking_for: req.body.lookingFor,
            experience_years: req.body.experienceYears,
            profileScore: req.body.bio ? 40 : 30,
            gender: user.gender,
            phone: {
  countryCode: req.body.phone.countryCode,
  mobile: req.body.phone.mobile
},
            primaryPhoto: {
                url:
                    photoUpload?.fileUrl ||
                    "https://devtinder-photos-prod.s3.ap-south-1.amazonaws.com/server/1769291057074.jpg",
                key:
                    req.body?.key ||
                    "users/6965b4c3d885ab88dee4ff61/15f16d465f154373-1000265046.jpg"
            },
            location: {
                city: info.city,
                country: info.country,
                geo: {
                    coordinates: [longitude, latitude]
                }
            }
        });

        return sendResponse(res, 201, {
            data: {
                username: data.username,
                displayName: data.displayName,
                bio: data.bio,
                role: data.role,
                tech_stack: data.tech_stack,
                looking_for: data.looking_for,
                experience_years: data.experience_years,
                location: {
                    city: data.location.city,
                    country: data.location.country
                },
                visibility: "public",
                primaryPhoto: data.primaryPhoto.url,
                profileScore: data.profileScore,
                createdAt: data.createdAt
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
                message: error.message
            });
        }
    }
};
