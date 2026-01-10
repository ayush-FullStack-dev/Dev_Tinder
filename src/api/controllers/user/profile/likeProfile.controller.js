import ProfileLike from "../../../../models/ProfileLike.model.js";

import sendResponse from "../../../../helpers/sendResponse.js";

import {
    findProfile,
    updateProfile
} from "../../../../services/profile.service.js";

export const likePublicProfile = async (req, res) => {
    const { currentProfile } = req.auth;

    const profileInfo = await findProfile({
        username: req.params?.username
    });

    if (!profileInfo || profileInfo.visibility !== "public") {
        return sendResponse(res, 404, "Profile not found");
    }

    const alreadyLiked = await ProfileLike.findOne({
        likedByUserId: currentProfile._id
    });

    if (alreadyLiked) {
        return sendResponse(res, 200, {
            message: "Already liked",
            data: {
                username: profileInfo.username,
                liked: true
            }
        });
    }

    if (currentProfile.id === profileInfo.id) {
        return sendResponse(res, 200, "You cannot like your own profile");
    }

    await ProfileLike.create({
        likedByUserId: currentProfile._id,
        likedProfileUserId: profileInfo._id
    });

    const updateInfo = await updateProfile(
        {
            _id: profileInfo._id
        },
        {
            $inc: {
                "stats.likes": 1
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Profile liked",
        data: {
            username: updateInfo.username,
            liked: true,
            stats: {
                likes: updateInfo.stats.likes
            }
        }
    });
};

export const unlikePublicProfile = async (req, res) => {
    const { currentProfile } = req.auth;

    const profileInfo = await findProfile({
        username: req.params?.username
    });

    if (!profileInfo || profileInfo.visibility !== "public") {
        return sendResponse(res, 404, "Profile not found");
    }

    const alreadyLiked = await ProfileLike.findOne({
        likedByUserId: currentProfile._id
    });

    if (!alreadyLiked) {
        return sendResponse(res, 200, {
            message: "Profile was not liked",
            data: {
                username: profileInfo.username,
                liked: false
            }
        });
    }

    const { deletedCount } = await ProfileLike.deleteMany({
        likedByUserId: profileInfo._id
    });

    const updateInfo = await updateProfile(
        {
            _id: profileInfo._id
        },
        {
            $inc: {
                "stats.likes": -deletedCount
            }
        }
    );

    return sendResponse(res, 200, {
        message: "Like removed",
        data: {
            username: updateInfo.username,
            liked: false,
            stats: {
                likes: updateInfo.stats.likes
            }
        }
    });
};
