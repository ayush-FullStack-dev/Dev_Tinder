import { updatePushSubscription } from "../services/pushSubscription.service.js";
import { updateUser } from "../services/user.service.js";
import { updateProfile } from "../services/profile.service.js";

import ProfileLike from "../models/ProfileLike.model.js";
import ProfileView from "../models/ProfileView.model.js";
import Block from "../models/Block.model.js";

export const updateProfileDeleteInfo = async (
    currentProfile,
    gracePeriodTime
) => {
    const many = { many: true };
    const updateInfo = {
        deletedAt: gracePeriodTime
    };
    await updatePushSubscription(
        {
            userId: currentProfile.userId
        },
        updateInfo,
        many
    );
    await updateUser(
        {
            _id: currentProfile.userId
        },
        updateInfo
    );
    await updateProfile(
        {
            _id: currentProfile._id
        },
        { ...updateInfo, visibility: !gracePeriodTime ? "public" : "hidden" }
    );

    await ProfileLike.updateMany(
        {
            likedProfileUserId: currentProfile._id
        },
        updateInfo
    );

    await ProfileView.updateMany(
        {
            viewedUserId: currentProfile._id
        },
        updateInfo
    );

    await Block.updateMany(
        {
            blockerUserId: currentProfile._id
        },
        updateInfo
    );

    return true;
};
