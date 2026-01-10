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

    likedAt: {
        type: Date,
        default: () => new Date()
    },

    
});

export default mongoose.model("ProfileLike", profileLikeSchema);
