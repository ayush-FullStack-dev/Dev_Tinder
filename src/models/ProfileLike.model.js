import mongoose from "mongoose";

const profileLikeSchema = new mongoose.Schema({
    likedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    likedProfileUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
        index: true,
        required: true
    },
    action: {
        type: String,
        enum: ["profile_like", "swipe_like"],
        required: true
    },

    likedAt: {
        type: Date,
        default: () => new Date()
    },
    deletedAt: {
        type: Date,
        default: null,
        expires: 0
    }
});

export default mongoose.model("ProfileLike", profileLikeSchema);
