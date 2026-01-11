import sendResponse from "../../../../helpers/sendResponse.js";

import {
    findProfile,
    createProfile
} from "../../../../services/profile.service.js";

import { profileSetupValidator } from "../../../../validators/user/profile.validator.js";
import { checkValidation } from "../../../../helpers/helpers.js";
import { getCoordinates, getIpDetails } from "../../../../helpers/ip.js";

export const profileSetupHandler = async (req, res) => {
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
            profileScore: data.profileScore,
            createdAt: data.createdAt
        }
    });
};
