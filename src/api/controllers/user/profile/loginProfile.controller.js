import sendResponse from "../../../../helpers/sendResponse.js";

export const loginProfileInfo = async (req, res) => {
    const { profileInfo } = req.auth;

    return sendResponse(res, 200, {
        data: {
            username: profileInfo.username,
            displayName: profileInfo.displayName,
            bio: profileInfo.bio,
            role: profileInfo.role,
            tech_stack: profileInfo.tech_stack,
            looking_for: profileInfo.looking_for,
            experience_years: profileInfo.experience_years,
            location: {
                city: profileInfo.location.city,
                country: profileInfo.location.country
            },
            visibility: profileInfo.visibility,
            profileScore: profileInfo.profileScore,
            createdAt: profileInfo.createdAt,
            updatedAt: profileInfo.updatedAt
        }
    });
};
